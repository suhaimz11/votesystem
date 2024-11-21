"use client"
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from '../../component/metamask';

// Voting Contract ABI
const VotingABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum Voting.Candidate",
        "name": "candidate",
        "type": "uint8"
      }
    ],
    "name": "Voted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "VotingEnded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "endVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum Voting.Candidate",
        "name": "candidate",
        "type": "uint8"
      }
    ],
    "name": "getVotes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getWinner",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum Voting.Candidate",
        "name": "candidate",
        "type": "uint8"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum Voting.Candidate",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "votes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votingEnded",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const contractAddress = "0x16115d474AF482591d5c15B0536B9bc559590a51";

export default function VotingPage() {
  const { account, signer, connected, connect, disconnect } = useMetaMask();
  const [votes, setVotes] = useState({ trump: 0, kamala: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [votingEnded, setVotingEnded] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchVotingStatus = async () => {
      if (signer && account) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(contractAddress, VotingABI, await provider.getSigner());
          
          const isVotingEnded = await contract.votingEnded();
          setVotingEnded(isVotingEnded);

          const trumpVotes = await contract.getVotes(0);
          const kamalaVotes = await contract.getVotes(1);
          setVotes({ 
            trump: Number(trumpVotes), 
            kamala: Number(kamalaVotes) 
          });

          const contractWinner = await contract.getWinner();
          setWinner(contractWinner);

          const voted = await contract.hasVoted(account);
          setHasVoted(voted);
        } catch (error) {
          console.error("Error fetching voting status:", error);
        }
      }
    };

    fetchVotingStatus();
  }, [signer, account]);

  const voteFor = async (candidate: number) => {
    if (!signer || !account) {
      alert("Please connect wallet first");
      return;
    }

    if (hasVoted) {
      alert("You have already voted.");
      return;
    }

    if (votingEnded) {
      alert("Voting has ended.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, VotingABI, await provider.getSigner());
      
      const tx = await contract.vote(candidate);
      await tx.wait();
      
      alert("Vote submitted successfully!");
      
      // Refresh voting status
      const isVotingEnded = await contract.votingEnded();
      const trumpVotes = await contract.getVotes(0);
      const kamalaVotes = await contract.getVotes(1);
      
      setVotes({ 
        trump: Number(trumpVotes), 
        kamala: Number(kamalaVotes) 
      });
      setVotingEnded(isVotingEnded);
      setHasVoted(true);
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to submit vote.");
    }
  };

  const endVoting = async () => {
    if (!signer || !account) {
      alert("Please connect wallet first");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, VotingABI, await provider.getSigner());
      
      const tx = await contract.endVote();
      await tx.wait();
      
      alert("Voting has ended.");
      
      // Refresh voting status
      const isVotingEnded = await contract.votingEnded();
      const contractWinner = await contract.getWinner();
      
      setVotingEnded(isVotingEnded);
      setWinner(contractWinner);
    } catch (error) {
      console.error("Error ending voting:", error);
      alert("Failed to end voting.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Voting App</h1>
      
      {!connected ? (
        <button 
          onClick={connect} 
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <p className="mb-2">Connected Account: {account}</p>
          
          <div className="mb-4">
            <p>Voting Status: {votingEnded ? "Closed" : "Open"}</p>
            <p>Trump Votes: {votes.trump}</p>
            <p>Kamala Votes: {votes.kamala}</p>
            
            {winner && <p className="font-bold mt-2">Winner: {winner}</p>}
          </div>

          {!hasVoted && !votingEnded && (
            <div className="flex space-x-4 mb-4">
              <button 
                onClick={() => voteFor(0)} 
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Vote Trump
              </button>
              <button 
                onClick={() => voteFor(1)} 
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Vote Kamala
              </button>
            </div>
          )}

          <button 
            onClick={endVoting} 
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            End Voting
          </button>

          <button 
            onClick={disconnect} 
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mt-4"
          >
            Disconnect Wallet
          </button>
        </>
      )}
    </div>
  );
}