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
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-semibold mb-6 text-yellow-300 text-center">Voting App</h1>
        
        {!connected ? (
          <button 
            onClick={connect} 
            className="w-full bg-yellow-500 text-gray-800 py-2 rounded-lg hover:bg-yellow-400 transition"
          >
            Connect Wallet
          </button>
        ) : (
          <>
            <p className="mb-4 text-center text-lg text-white">Connected Account: {account}</p>
            
            <div className="mb-6">
              <p className="text-lg text-white">Voting Status: {votingEnded ? "Closed" : "Open"}</p>
              <p className="text-lg text-white">Trump Votes: {votes.trump}</p>
              <p className="text-lg text-white">Kamala Votes: {votes.kamala}</p>
              
              {winner && <p className="font-bold mt-4 text-yellow-300 text-center">Winner: {winner}</p>}
            </div>

            {!hasVoted && !votingEnded && (
              <div className="flex justify-between mb-6">
                <button 
                  onClick={() => voteFor(0)} 
                  className="flex-1 bg-red-700 text-white py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Vote Trump
                </button>
                <button 
                  onClick={() => voteFor(1)} 
                  className="flex-1 bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Vote Kamala
                </button>
              </div>
            )}

            <button 
              onClick={endVoting} 
              className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-600 transition mb-4"
            >
              End Voting
            </button>

            <button 
              onClick={disconnect} 
              className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-600 transition"
            >
              Disconnect Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}
