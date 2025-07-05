//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

// Use openzeppelin to inherit battle-tested implementations
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
        address player;
        uint256 deposit;
        uint256 gameId;
        uint256 playerBoxIndex;
        uint256 currentRound;
        uint256 lastOffer;
        uint256[] remainingBoxes;
        uint256[] eliminatedBoxes;
        GameState state;
        uint256 createdAt;
        bool isActive;
    }

    // Prize pool (fixed amounts in wei) - 26 boxes total
    uint256[] public prizePool;

    // Game tracking
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    uint256 public nextGameId;

    // House funds
    uint256 public houseFunds;

    // Constants
    uint256 public constant ENTRY_FEE = 1 ether;
    uint256 public constant MAX_PRIZE = 30 ether;
    uint256 public constant HOUSE_OFFER_PERCENTAGE = 75; // 75% of EV
    uint256 public constant TOTAL_BOXES = 26;

    // Round elimination requirements
    uint256[] public roundEliminations = [6, 5, 4, 3, 2, 1]; // Boxes to eliminate per round

    // Events
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 playerBox);
    event BoxesEliminated(uint256 indexed gameId, uint256[] eliminatedBoxes, uint256 round);
    event OfferMade(uint256 indexed gameId, uint256 offer, uint256 round);
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

    constructor(address _owner) Ownable(_owner) {
        _initializePrizePool();
    }

    /**
     * Initialize the prize pool with 26 box values
     */
    function _initializePrizePool() internal {
        prizePool = [
            0.01 ether,
            0.05 ether,
            0.1 ether,
            0.25 ether,
            0.5 ether,
            0.75 ether,
            1 ether,
            1.5 ether,
            2 ether,
            2.5 ether,
            3 ether,
            4 ether,
            5 ether,
            6 ether,
            7 ether,
            8 ether,
            9 ether,
            10 ether,
            12 ether,
            15 ether,
            18 ether,
            20 ether,
            22 ether,
            25 ether,
            27 ether,
            30 ether
        ];
    }

    /**
     * Start a new game - player deposits 1 ETH and selects their box
     */
    function startGame() external payable nonReentrant {
        require(msg.value == ENTRY_FEE, "Must deposit exactly 1 ETH");

        uint256 gameId = nextGameId++;
        uint256 playerBoxIndex = _generateRandomBoxIndex(gameId, msg.sender);

        // Initialize remaining boxes (all except player's box)
        uint256[] memory remaining = new uint256[](TOTAL_BOXES - 1);
        uint256 remainingIndex = 0;
        for (uint256 i = 0; i < TOTAL_BOXES; i++) {
            if (i != playerBoxIndex) {
                remaining[remainingIndex] = i;
                remainingIndex++;
            }
        }

        // Create new game
        games[gameId] = Game({
            player: msg.sender,
            deposit: msg.value,
            gameId: gameId,
            playerBoxIndex: playerBoxIndex,
            currentRound: 0,
            lastOffer: 0,
            remainingBoxes: remaining,
            eliminatedBoxes: new uint256[](0),
            state: GameState.Playing,
            createdAt: block.timestamp,
            isActive: true
        });

        // Track player's games
        playerGames[msg.sender].push(gameId);

        emit GameStarted(gameId, msg.sender, playerBoxIndex);
    }

    /**
     * Eliminate boxes for the current round
     */
    function eliminateBoxes(uint256 gameId, uint256[] calldata boxIndexes)
        external
        gameExists(gameId)
        onlyPlayer(gameId)
        gameInState(gameId, GameState.Playing)
        nonReentrant
    {
        Game storage game = games[gameId];
        require(game.currentRound < roundEliminations.length, "Game already finished");
        require(boxIndexes.length == roundEliminations[game.currentRound], "Wrong number of boxes");

        // Verify all boxes are in remaining boxes
        for (uint256 i = 0; i < boxIndexes.length; i++) {
            require(_isBoxInArray(boxIndexes[i], game.remainingBoxes), "Box not available");
        }

        // Remove eliminated boxes from remaining boxes
        for (uint256 i = 0; i < boxIndexes.length; i++) {
            _removeBoxFromArray(boxIndexes[i], game.remainingBoxes);
            game.eliminatedBoxes.push(boxIndexes[i]);
        }

        game.currentRound++;

        // Calculate and make offer if not final round
        if (game.currentRound < roundEliminations.length) {
            uint256 offer = _calculateOffer(gameId);
            game.lastOffer = offer;
            game.state = GameState.OfferMade;

            emit BoxesEliminated(gameId, boxIndexes, game.currentRound);
            emit OfferMade(gameId, offer, game.currentRound);
        } else {
            // Final round - last elimination before final choice
            uint256 finalOffer = _calculateOffer(gameId);
            game.lastOffer = finalOffer;
            game.state = GameState.OfferMade;

            emit BoxesEliminated(gameId, boxIndexes, game.currentRound);
            emit OfferMade(gameId, finalOffer, game.currentRound);
        }
    }

    /**
     * Accept the current deal offer
     */
    function acceptDeal(uint256 gameId)
        external
        gameExists(gameId)
        onlyPlayer(gameId)
        gameInState(gameId, GameState.OfferMade)
        nonReentrant
        houseSolvent(games[gameId].lastOffer)
    {
        Game storage game = games[gameId];
        uint256 payout = game.lastOffer;

        game.state = GameState.DealTaken;
        game.isActive = false;

        // Transfer payout to player
        houseFunds -= payout;
        payable(game.player).transfer(payout);

        emit DealAccepted(gameId, game.player, payout);
        emit GameCompleted(gameId, game.player, payout);
    }

    /**
     * Reject the current deal offer
     */
    function rejectDeal(uint256 gameId)
        external
        gameExists(gameId)
        onlyPlayer(gameId)
        gameInState(gameId, GameState.OfferMade)
        nonReentrant
    {
        Game storage game = games[gameId];

        // If this was the final offer, complete the game
        if (game.currentRound >= roundEliminations.length) {
            _completeGame(gameId);
        } else {
            // Continue to next round
            game.state = GameState.Playing;
            emit DealRejected(gameId, game.currentRound);
        }
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

        // Add remaining boxes
        for (uint256 i = 0; i < game.remainingBoxes.length; i++) {
            totalValue += prizePool[game.remainingBoxes[i]];
        }

        uint256 totalBoxes = game.remainingBoxes.length + 1; // +1 for player's box
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
     * Remove a box from the array
     */
    function _removeBoxFromArray(uint256 box, uint256[] storage array) internal {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == box) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
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
        return games[gameId].remainingBoxes;
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
