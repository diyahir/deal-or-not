pragma solidity ^0.8.0;

// solhint-disable-next-line no-unused-import
import "../interfaces/IVRF.sol";
import { IEntropyConsumer } from "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import { IEntropy } from "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";

// @param entropyAddress The address of the entropy contract.
contract MonadVRF is IVRF, IEntropyConsumer {
    IEntropy public entropy;
    address public entropyProvider;
    address public owner;

    // Storage for random numbers
    mapping(uint64 => bytes32) public randomNumbers;

    // Events
    event EntropyProviderSet(address indexed provider);
    event EntropyContractSet(address indexed entropy);
    event RandomNumberRequested(uint64 indexed sequenceNumber, bytes32 userRandomNumber);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(address _entropyAddress) {
        require(_entropyAddress != address(0), "Entropy address cannot be zero");
        owner = msg.sender;
        entropy = IEntropy(_entropyAddress);

        // For testing purposes, we'll set entropyProvider to zero initially
        // It can be set later using setEntropyProvider function
        entropyProvider = address(0);

        emit EntropyContractSet(_entropyAddress);
    }

    // Function to set entropy provider (useful for testing and configuration)
    function setEntropyProvider(address _entropyProvider) external onlyOwner {
        entropyProvider = _entropyProvider;
        emit EntropyProviderSet(_entropyProvider);
    }

    // Function to initialize entropy provider from entropy contract
    function initializeEntropyProvider() external onlyOwner {
        require(address(entropy) != address(0), "Entropy contract not set");
        entropyProvider = entropy.getDefaultProvider();
        emit EntropyProviderSet(entropyProvider);
    }

    function requestRandomNumber(bytes32 userRandomNumber) external payable override returns (uint256) {
        require(entropyProvider != address(0), "Entropy provider not set");
        require(address(entropy) != address(0), "Entropy contract not set");

        uint256 fee = entropy.getFee(entropyProvider);
        require(msg.value >= fee, "Insufficient fee provided");

        uint64 sequenceNumber = entropy.requestWithCallback{ value: fee }(entropyProvider, userRandomNumber);

        // Emit event before returning
        emit RandomNumberRequested(sequenceNumber, userRandomNumber);

        return uint256(sequenceNumber);
    }

    function getEntropyFee() external view returns (uint256) {
        return entropy.getFee(entropyProvider);
    }

    // @param sequenceNumber The sequence number of the request.
    // @param provider The address of the provider that generated the random number. If your app uses multiple providers, you can use this argument to distinguish which one is calling the app back.
    // @param randomNumber The generated random number.
    // This method is called by the entropy contract when a random number is generated.
    // This method **must** be implemented on the same contract that requested the random number.
    // This method should **never** return an error -- if it returns an error, then the keeper will not be able to invoke the callback.
    // If you are having problems receiving the callback, the most likely cause is that the callback is erroring.
    // See the callback debugging guide here to identify the error https://docs.pyth.network/entropy/debug-callback-failures
    function entropyCallback(uint64 sequenceNumber, address provider, bytes32 randomNumber) internal override {
        // Store the random number
        randomNumbers[sequenceNumber] = randomNumber;
        // HERE we will hook into the main contract
    }

    // This method is required by the IEntropyConsumer interface.
    // It returns the address of the entropy contract which will call the callback.
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    // Function to retrieve stored random number
    function getRandomNumber(uint256 sequenceNumber) external view override returns (uint256) {
        return uint256(randomNumbers[uint64(sequenceNumber)]);
    }

    receive() external payable {}
}
