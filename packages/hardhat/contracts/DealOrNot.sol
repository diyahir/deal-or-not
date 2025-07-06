//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

// Use openzeppelin to inherit battle-tested implementations
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IVRF.sol";

/**
 * A Deal or Not smart contract that allows multiple players to play concurrent games
 * Players deposit 1 ETH to start a game and can win up to 30 ETH
 * House offers 75% of expected value at the end of each round
 * @author BuidlGuidl
 */
contract DealOrNot is ReentrancyGuard, Ownable {
    // Game state enum
    enum GameState {
        NotStarted,
        Playing,
        OfferMade,
        DealTaken,
        GameCompleted
    }

    // Individual game struct
    struct Game {
        address player; // Player address
        uint256 deposit; // Deposit amount
        uint256 gameId; // Game ID
        uint256 playerBoxIndex; // Index of the player's box
        uint256 currentRound; // Current round of the game
        uint256[] eliminatedBoxes; // Boxes that have been eliminated
        GameState state; // Current state of the game
        bool isActive; // Whether the game is still active
    }

    // Prize pool (fixed amounts in wei) - 26 boxes total
    uint256[] public prizePool;

    bool public isMonad;

    // Game tracking
    mapping(address => uint256) public gameIds;
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    mapping(uint256 => uint256) public requestIds;
    uint256 public nextGameId;

    // House funds
    uint256 public houseFunds;

    // Constants
    uint256 public constant ENTRY_FEE = 0.1 ether;
    uint256 public constant HOUSE_OFFER_PERCENTAGE = 75; // 75% of EV
    uint256 public constant TOTAL_BOXES = 26;

    // VRF
    IVRF public vrf;

    // Round elimination requirements
    uint256[] public roundEliminations = [6, 5, 4, 3, 2, 1]; // Boxes to eliminate per round

    // Events
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 playerBox);
    event BoxesEliminated(uint256 indexed gameId, uint256[] eliminatedBoxes, uint256 round);
    event DealAccepted(uint256 indexed gameId, address indexed player, uint256 payout);
    event DealRejected(uint256 indexed gameId, uint256 round);
    event GameCompleted(uint256 indexed gameId, address indexed player, uint256 finalPayout);
    event HouseFundsDeposited(uint256 amount);
    event HouseFundsWithdrawn(uint256 amount);

    // Modifiers
    modifier gameExists(uint256 gameId) {
        require(gameId < nextGameId, "Game does not exist");
        _;
    }

    modifier onlyPlayer(uint256 gameId) {
        require(games[gameId].player == msg.sender, "Not your game");
        _;
    }

    modifier gameInState(uint256 gameId, GameState requiredState) {
        require(games[gameId].state == requiredState, "Invalid game state");
        _;
    }

    modifier houseSolvent(uint256 amount) {
        require(houseFunds >= amount, "House insufficient funds");
        _;
    }

    constructor(address _owner, address _vrf, bool _isMonad) Ownable(_owner) {
        vrf = IVRF(_vrf);
        isMonad = _isMonad;
        _initializePrizePool();
    }

    /**
     * Initialize the prize pool with 26 box values
     */
    function _initializePrizePool() internal {
        prizePool = [
            0.00001 ether,
            0.0001 ether,
            0.0005 ether,
            0.001 ether,
            0.0025 ether,
            0.005 ether,
            0.0075 ether,
            0.01 ether,
            0.02 ether,
            0.03 ether,
            0.04 ether,
            0.05 ether,
            0.075 ether,
            0.1 ether,
            0.5 ether,
            1 ether,
            2.5 ether,
            5 ether,
            7.5 ether,
            10 ether,
            20 ether,
            30 ether,
            40 ether,
            50 ether,
            75 ether,
            100 ether
        ];
    }

    /**
     * Start a new game - player deposits 1 ETH and selects their box
     */
    function startGame() external payable nonReentrant returns (uint256) {
        require(msg.value == ENTRY_FEE, "Must deposit exactly 0.1 ETH");

        uint256 gameId = nextGameId++;
        uint256 playerBoxIndex = _generateRandomBoxIndex(gameId, msg.sender);

        // Create new game
        games[gameId] = Game({
            player: msg.sender,
            deposit: msg.value,
            gameId: gameId,
            playerBoxIndex: playerBoxIndex,
            currentRound: 0,
            eliminatedBoxes: new uint256[](0),
            state: GameState.Playing,
            isActive: true
        });

        // Track player's games
        playerGames[msg.sender].push(gameId);
        gameIds[msg.sender] = gameId;

        uint256 fee = vrf.getEntropyFee();
        uint256 requestId = vrf.requestRandomNumber{ value: fee }(bytes32(gameId));
        requestIds[gameId] = requestId;

        emit GameStarted(gameId, msg.sender, playerBoxIndex);

        return gameId;
    }

    /**
     * Eliminate boxes for the current round (randomly selected) - OPTIMIZED
     * If called when an offer is pending, it implicitly rejects the offer
     */
    function eliminateBoxes(uint256 gameId) external gameExists(gameId) onlyPlayer(gameId) nonReentrant {
        Game storage game = games[gameId];
        require(game.state == GameState.Playing || game.state == GameState.OfferMade, "Invalid game state");

        // If there was a pending offer, emit rejection event
        if (game.state == GameState.OfferMade) {
            emit DealRejected(gameId, game.currentRound);
        }

        // Check if we've reached the final round
        if (game.currentRound >= roundEliminations.length) {
            _completeGame(gameId);
            return;
        }

        // Randomly select and directly add boxes to eliminated array
        uint256 numToEliminate = roundEliminations[game.currentRound];
        uint256[] memory boxesToEliminate = _selectAndEliminateBoxes(gameId, numToEliminate);

        game.currentRound++;
        game.state = GameState.OfferMade;

        emit BoxesEliminated(gameId, boxesToEliminate, game.currentRound);

        // request a new random number
        uint256 requestId = vrf.requestRandomNumber(bytes32(gameId));
        requestIds[gameId] = requestId;
    }

    /**
     * Efficient random box selection using Fisher-Yates shuffle - no loops needed
     */
    function _selectAndEliminateBoxes(uint256 gameId, uint256 numToEliminate) internal returns (uint256[] memory) {
        Game storage game = games[gameId];

        // Pre-calculate total available boxes to avoid repeated calculations
        uint256 totalEliminated = game.eliminatedBoxes.length;
        uint256 availableCount = TOTAL_BOXES - totalEliminated - 1; // -1 for player's box
        require(availableCount >= numToEliminate, "Not enough boxes to eliminate");

        // Create array of available box indices
        uint256[] memory availableBoxes = new uint256[](availableCount);
        uint256 index = 0;

        // Fill array with available boxes (excluding player's box and already eliminated boxes)
        for (uint256 i = 0; i < TOTAL_BOXES; i++) {
            if (i != game.playerBoxIndex && !_isBoxEliminated(i, game.eliminatedBoxes)) {
                availableBoxes[index] = i;
                index++;
            }
        }

        // Use Fisher-Yates shuffle to select boxes deterministically
        uint256[] memory selectedBoxes = new uint256[](numToEliminate);
        uint256 baseRandomSeed = vrf.getRandomNumber(requestIds[gameId]);

        for (uint256 i = 0; i < numToEliminate; i++) {
            // Generate unique random index for each selection
            uint256 randomSeed = uint256(
                keccak256(abi.encodePacked(baseRandomSeed, i, block.timestamp, block.prevrandao))
            );
            uint256 randomIndex = randomSeed % (availableCount - i);

            // Select the box at randomIndex
            selectedBoxes[i] = availableBoxes[randomIndex];

            // Swap selected box to end to avoid reselection (Fisher-Yates)
            availableBoxes[randomIndex] = availableBoxes[availableCount - 1 - i];

            // Add to eliminated boxes
            game.eliminatedBoxes.push(selectedBoxes[i]);
        }

        return selectedBoxes;
    }

    /**
     * More efficient check if box is already eliminated using early termination
     */
    function _isBoxEliminated(uint256 box, uint256[] storage eliminatedBoxes) internal view returns (bool) {
        uint256 length = eliminatedBoxes.length;
        for (uint256 i = 0; i < length; i++) {
            if (eliminatedBoxes[i] == box) {
                return true;
            }
        }
        return false;
    }

    /**
     * Accept the current deal offer
     */
    function acceptDeal(
        uint256 gameId
    )
        external
        gameExists(gameId)
        onlyPlayer(gameId)
        gameInState(gameId, GameState.OfferMade)
        nonReentrant
        houseSolvent(_calculateOffer(gameId))
    {
        Game storage game = games[gameId];
        uint256 payout = _calculateOffer(gameId);

        game.state = GameState.DealTaken;
        game.isActive = false;

        // Transfer payout to player
        houseFunds -= payout;
        payable(game.player).transfer(payout);

        emit DealAccepted(gameId, game.player, payout);
        emit GameCompleted(gameId, game.player, payout);
    }

    /**
     * Complete the game - player gets their original box value
     */
    function _completeGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        uint256 finalPayout = prizePool[game.playerBoxIndex];

        game.state = GameState.GameCompleted;
        game.isActive = false;

        // Transfer final payout to player
        require(houseFunds >= finalPayout, "House insufficient funds");
        houseFunds -= finalPayout;
        payable(game.player).transfer(finalPayout);

        emit GameCompleted(gameId, game.player, finalPayout);
    }

    /**
     * Calculate house offer (75% of expected value)
     */
    function _calculateOffer(uint256 gameId) internal view returns (uint256) {
        Game storage game = games[gameId];
        uint256 totalValue = 0;

        // Include player's box in calculation
        totalValue += prizePool[game.playerBoxIndex];

        // Add remaining boxes (all boxes except eliminated ones and player's box)
        for (uint256 i = 0; i < TOTAL_BOXES; i++) {
            if (i != game.playerBoxIndex && !_isBoxInArray(i, game.eliminatedBoxes)) {
                totalValue += prizePool[i];
            }
        }

        uint256 totalBoxes = (TOTAL_BOXES - game.eliminatedBoxes.length); // Total minus eliminated
        uint256 expectedValue = totalValue / totalBoxes;

        return (expectedValue * HOUSE_OFFER_PERCENTAGE) / 100;
    }

    /**
     * Generate pseudo-random box index for player
     */
    function _generateRandomBoxIndex(uint256 gameId, address player) internal view returns (uint256) {
        uint256 randomSeed = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player, gameId, blockhash(block.number - 1)))
        );

        return randomSeed % TOTAL_BOXES;
    }

    /**
     * Check if a box is in the array
     */
    function _isBoxInArray(uint256 box, uint256[] memory array) internal pure returns (bool) {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == box) {
                return true;
            }
        }
        return false;
    }

    /**
     * Owner deposits funds to house
     */
    function depositHouseFunds() external payable onlyOwner {
        houseFunds += msg.value;
        emit HouseFundsDeposited(msg.value);
    }

    /**
     * Owner withdraws house funds
     */
    function withdrawHouseFunds(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= houseFunds, "Insufficient house funds");
        require(amount <= address(this).balance, "Insufficient contract balance");

        houseFunds -= amount;
        payable(owner()).transfer(amount);
        emit HouseFundsWithdrawn(amount);
    }

    /**
     * View functions
     */
    function getGameState(uint256 gameId) external view gameExists(gameId) returns (Game memory) {
        return games[gameId];
    }

    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }

    function getRemainingBoxes(uint256 gameId) external view gameExists(gameId) returns (uint256[] memory) {
        Game storage game = games[gameId];

        // Calculate how many boxes remain
        uint256 remainingCount = TOTAL_BOXES - game.eliminatedBoxes.length - 1; // -1 for player's box
        uint256[] memory remaining = new uint256[](remainingCount);

        uint256 index = 0;
        for (uint256 i = 0; i < TOTAL_BOXES; i++) {
            if (i != game.playerBoxIndex && !_isBoxInArray(i, game.eliminatedBoxes)) {
                remaining[index] = i;
                index++;
            }
        }

        return remaining;
    }

    function getEliminatedBoxes(uint256 gameId) external view gameExists(gameId) returns (uint256[] memory) {
        return games[gameId].eliminatedBoxes;
    }

    function getCurrentOffer(uint256 gameId) external view gameExists(gameId) returns (uint256) {
        return _calculateOffer(gameId);
    }

    function getPrizePool() external view returns (uint256[] memory) {
        return prizePool;
    }

    function getBoxValue(uint256 boxIndex) external view returns (uint256) {
        require(boxIndex < TOTAL_BOXES, "Invalid box index");
        return prizePool[boxIndex];
    }

    function getHouseFunds() external view returns (uint256) {
        return houseFunds;
    }

    function getTotalGames() external view returns (uint256) {
        return nextGameId;
    }

    /**
     * Emergency function to allow contract to receive ETH
     */
    receive() external payable {
        houseFunds += msg.value;
        emit HouseFundsDeposited(msg.value);
    }
}
