// solhint-disable-next-line
import { ContractRegistry } from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
// solhint-disable-next-line
import { RandomNumberV2Interface } from "@flarenetwork/flare-periphery-contracts/coston2/RandomNumberV2Interface.sol";

contract SecureRandomConsumer {
    RandomNumberV2Interface internal randomV2;

    /**
     * Initializing an instance with RandomNumberV2Interface.
     * The contract registry is used to fetch the contract address.
     */
    constructor() {
        randomV2 = ContractRegistry.getRandomNumberV2();
    }

    /**
     * Fetch the latest secure random number.
     * The random number is generated every 90 seconds.
     */
    function getSecureRandomNumber() external view returns (uint256 randomNumber, bool isSecure, uint256 timestamp) {
        (randomNumber, isSecure, timestamp) = randomV2.getRandomNumber();
        /* DO NOT USE THE RANDOM NUMBER IF isSecure=false. */
        require(isSecure, "Random number is not secure");
        /* Your custom RNG consumption logic. In this example the values are just returned. */
        return (randomNumber, isSecure, timestamp);
    }
}
