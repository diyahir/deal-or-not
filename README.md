# 🎯 Deal or Not - Blockchain Game

<h4 align="center">
  <a href="#-game-mechanics">Game Mechanics</a> |
  <a href="#-supported-networks">Networks</a> |
  <a href="#-quick-start">Quick Start</a> |
  <a href="#-deployment">Deployment</a>
</h4>

🎮 A decentralized implementation of the classic "Deal or No Deal" game show on multiple blockchain networks. Players deposit 12 ETH to start a game and can win up to 100 ETH based on their luck and strategy.

⚡ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript with multi-chain VRF (Verifiable Random Function) support for provably fair randomness.

## 🎲 Game Mechanics

### How to Play

1. **Start Game**: Deposit 12 ETH to begin your game
2. **Box Selection**: You're assigned a random box (1-26) containing an unknown prize
3. **Elimination Rounds**: In each round, a certain number of boxes are randomly eliminated:
   - Round 1: 6 boxes eliminated
   - Round 2: 5 boxes eliminated
   - Round 3: 4 boxes eliminated
   - Round 4: 3 boxes eliminated
   - Round 5: 2 boxes eliminated
   - Round 6: 1 box eliminated
4. **Deal or No Deal**: After each round, the house offers you 75% of the expected value of remaining boxes
5. **Final Decision**: Accept the offer or continue to the next round
6. **Game End**: If you reject all offers, you win the value in your original box

### Prize Structure

The game features 26 boxes with prizes ranging from 0.00001 ETH to 100 ETH:

| Low Prizes (ETH) | Medium Prizes (ETH) | High Prizes (ETH) |
| ---------------- | ------------------- | ----------------- |
| 0.00001 - 0.01   | 0.02 - 0.1          | 0.5 - 100         |

### Smart Contract Features

- **Multiple Concurrent Games**: Multiple players can play simultaneously
- **House Funding**: Owner can deposit/withdraw house funds
- **Provably Fair**: VRF ensures random box elimination
- **Gas Optimized**: Efficient elimination algorithms
- **Multi-Chain**: Deployed on multiple testnets

## 🌐 Supported Networks

| Network   | Testnet        | VRF Provider | Status      |
| --------- | -------------- | ------------ | ----------- |
| **Flow**  | Flow Testnet   | Flow VRF     | ✅ Deployed |
| **Flare** | Flare Testnet  | Flare VRF    | ✅ Deployed |
| **Oasis** | Oasis Sapphire | Oasis VRF    | ✅ Deployed |
| **Monad** | Monad Testnet  | Pyth Entropy | ✅ Deployed |

## 🚀 Quick Start

### Prerequisites

- [Node.js (>= v20.18.3)](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/)
- [Git](https://git-scm.com/downloads)

### Local Development

1. **Clone and Install**:

```bash
git clone https://github.com/your-username/deal-or-not.git
cd deal-or-not
yarn install
```

2. **Start Local Blockchain**:

```bash
yarn chain
```

3. **Deploy Contracts**:

```bash
yarn deploy
```

4. **Start Frontend**:

```bash
yarn start
```

5. **Visit Your App**: `http://localhost:3000`

### Test the Game

1. Visit `http://localhost:3000/debug` to interact with contracts
2. Deposit house funds (owner only)
3. Start a game by depositing 12 ETH
4. Play through the rounds making deal/no deal decisions

## 🔧 Development

### Smart Contract Architecture

```
contracts/
├── DealOrNot.sol           # Main game contract
├── interfaces/
│   └── IVRF.sol           # VRF interface
└── vrf/
    ├── base.sol           # Base VRF implementation
    ├── flow.sol           # Flow network VRF
    ├── flare.sol          # Flare network VRF
    ├── oasis.sol          # Oasis network VRF
    └── monad.sol          # Monad network VRF
```

### Key Functions

- `startGame()`: Begin a new game (12 ETH deposit)
- `eliminateBoxes(gameId)`: Eliminate boxes for current round
- `acceptDeal(gameId)`: Accept house offer
- `getCurrentOffer(gameId)`: View current house offer
- `getGameState(gameId)`: Get complete game state

### Frontend Components

- **Game Interface**: Main game play screen
- **Box Grid**: Visual representation of boxes
- **Banker's Offer**: Deal offer display
- **Case Selection**: Box elimination interface
- **Game Statistics**: Player progress tracking

## 📦 Deployment

### Deploy to Testnet

1. **Generate Account**:

```bash
yarn generate
```

2. **Fund Your Account**: Get testnet tokens from faucets

3. **Deploy to Specific Network**:

```bash
# Flow Testnet
yarn deploy --network flowTestnet

# Flare Testnet
yarn deploy --network flareTestnet

# Oasis Testnet
yarn deploy --network oasisTestnet

# Monad Testnet
yarn deploy --network monadTestnet
```

### Environment Variables

Create `.env` file in `packages/hardhat/`:

```bash
DEPLOYER_PRIVATE_KEY_ENCRYPTED=your_encrypted_key
ALCHEMY_API_KEY=your_alchemy_key
MONAD_PK=your_monad_private_key
```

### Network Configuration

All networks are pre-configured in `packages/hardhat/hardhat.config.ts`:

- **Flow Testnet**: `https://testnet.evm.nodes.onflow.org`
- **Flare Testnet**: `https://coston2-api.flare.network/ext/C/rpc`
- **Oasis Testnet**: `https://testnet.sapphire.oasis.io`
- **Monad Testnet**: `https://rpc-testnet.monadinfra.com`

## 🧪 Testing

### Run Tests

```bash
# Run all tests
yarn hardhat:test

# Test specific VRF implementations
yarn test:monad-vrf-real --network monadTestnet
```

### Test Coverage

- Contract deployment and initialization
- Game state management
- Box elimination logic
- Deal acceptance/rejection
- House fund management
- VRF randomness verification

## 🎮 Game Strategy

### Tips for Players

1. **Early Rounds**: Consider the statistical expected value
2. **Risk Assessment**: Evaluate remaining high-value boxes
3. **House Edge**: Remember the house offers 75% of expected value
4. **Bankroll Management**: Only play with funds you can afford to lose

### Expected Values

The house calculates offers based on:

- Remaining boxes (excluding eliminated and player's box)
- Total value of remaining boxes
- 75% of calculated expected value

## 🤝 Contributing

We welcome contributions to Deal or Not!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Scaffold-ETH 2](https://scaffoldeth.io)
- VRF implementations for multi-chain randomness
- Inspired by the classic "Deal or No Deal" game show
- ETH Global hackathon project

---

**⚠️ Disclaimer**: This is a game of chance. Only play with funds you can afford to lose. Smart contracts are provided as-is without warranty.
