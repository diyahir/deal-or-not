// solhint-disable-next-line
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract OasisVRF {
    function getRandomNumber(uint256 length) external view returns (uint256) {
        return uint256(bytes32(Sapphire.randomBytes(32, "")));
    }
}
