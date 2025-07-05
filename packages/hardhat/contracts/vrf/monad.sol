pragma solidity ^0.8.0;

// solhint-disable-next-line no-unused-import
import { IEntropyConsumer } from "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import { IEntropy } from "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";

// @param entropyAddress The address of the entropy contract.
contract MonadVRF is IEntropyConsumer {
    IEntropy public entropy;
    address public entropyProvider;

    // Storage for random numbers
    mapping(uint64 => bytes32) public randomNumbers;

    constructor() {
        entropy = IEntropy(entropy.getDefaultProvider());
        entropyProvider = entropy.getDefaultProvider();
    }

    function requestRandomNumber(bytes32 userRandomNumber) external payable {
        uint256 fee = entropy.getFee(entropyProvider);

        uint64 sequenceNumber = entropy.requestWithCallback{ value: fee }(entropyProvider, userRandomNumber);
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
    function getRandomNumber(uint64 sequenceNumber) external view returns (bytes32) {
        return randomNumbers[sequenceNumber];
    }
}
