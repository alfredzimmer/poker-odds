'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Player, Card, OddsResult } from '@/lib/types';
import CardDisplay from '@/components/CardDisplay';
import CardSelectorGrid from '@/components/CardSelectorGrid';
import PieChart from '@/components/PieChart';
import ThemeToggle from '@/components/ThemeToggle';
import GitHubLink from '@/components/GitHubLink';
import { calculateOdds, calculateHandStrength } from '@/lib/calculator';

type CardPosition = {
  playerIndex: number;
  cardIndex: 0 | 1;
} | {
  type: 'community';
  cardIndex: number;
} | null;

const PLAYER_COLORS = [
  '#2563EB',
  '#DC2626',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#DB2777',
  '#0891B2',
  '#EA580C',
  '#4F46E5',
];

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', cards: [null, null] },
    { id: '2', name: 'Player 2', cards: [null, null] }
  ]);
  const [communityCards, setCommunityCards] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [odds, setOdds] = useState<OddsResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<CardPosition>({ playerIndex: 0, cardIndex: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedPlayers = localStorage.getItem('poker-odds-players');
        const cachedCommunityCards = localStorage.getItem('poker-odds-community-cards');
        
        if (cachedPlayers) {
          const parsedPlayers = JSON.parse(cachedPlayers);
          setPlayers(parsedPlayers);
        }
        
        if (cachedCommunityCards) {
          const parsedCommunityCards = JSON.parse(cachedCommunityCards);
          setCommunityCards(parsedCommunityCards);
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem('poker-odds-players', JSON.stringify(players));
      } catch (error) {
        console.error('Error saving players to cache:', error);
      }
    }
  }, [players, isLoaded]);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem('poker-odds-community-cards', JSON.stringify(communityCards));
      } catch (error) {
        console.error('Error saving community cards to cache:', error);
      }
    }
  }, [communityCards, isLoaded]);

  const usedCards = useMemo(() => {
    const cards: (Card | null)[] = [];
    for (const player of players) {
      cards.push(player.cards[0], player.cards[1]);
    }
    cards.push(...communityCards);
    return cards;
  }, [players, communityCards]);

  const validPlayers = useMemo(() => 
    players.filter(p => p.cards[0] && p.cards[1]), 
    [players]
  );
  const isSingleHandMode = validPlayers.length === 1;

  useEffect(() => {
    const validPlayers = players.filter(p => p.cards[0] && p.cards[1]);
    
    if (validPlayers.length === 0) {
      setOdds([]);
      return;
    }
    
    setIsCalculating(true);
    const timer = setTimeout(() => {
      if (validPlayers.length === 1) {
        const player = validPlayers[0];
        const numOpponents = players.length - 1;
        
        const result = calculateHandStrength(
          [player.cards[0]!, player.cards[1]!],
          communityCards,
          numOpponents,
        );
        setOdds([{
          playerId: player.id,
          playerName: `${player.name} vs ${numOpponents} opponent${numOpponents > 1 ? 's' : ''}`,
          winPercentage: result.winPercentage,
          tiePercentage: result.tiePercentage
        }]);
      } else {
        const result = calculateOdds(players, communityCards);
        setOdds(result);
      }
      setIsCalculating(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [players, communityCards]);

  const handleCardSelect = (card: Card) => {
    if (!selectedPosition) return;

    if ('type' in selectedPosition && selectedPosition.type === 'community') {
      const newCommunityCards = [...communityCards];
      newCommunityCards[selectedPosition.cardIndex] = card;
      setCommunityCards(newCommunityCards);
      setTimeout(() => findNextEmptySlot(newCommunityCards, players), 0);
    } else if ('playerIndex' in selectedPosition) {
      const newPlayers = [...players];
      newPlayers[selectedPosition.playerIndex].cards[selectedPosition.cardIndex] = card;
      setPlayers(newPlayers);
      setTimeout(() => findNextEmptySlot(communityCards, newPlayers), 0);
    }
  };

  const handleCardRemove = (position: CardPosition) => {
    if (!position) return;

    if ('type' in position && position.type === 'community') {
      const newCommunityCards = [...communityCards];
      newCommunityCards[position.cardIndex] = null;
      setCommunityCards(newCommunityCards);
    } else if ('playerIndex' in position) {
      const newPlayers = [...players];
      newPlayers[position.playerIndex].cards[position.cardIndex] = null;
      setPlayers(newPlayers);
    }
    
    setSelectedPosition(position);
  };

  const findNextEmptySlot = (community: (Card | null)[] = communityCards, playersList: Player[] = players) => {
    for (let i = 0; i < playersList.length; i++) {
      if (!playersList[i].cards[0]) {
        setSelectedPosition({ playerIndex: i, cardIndex: 0 });
        return;
      }
      if (!playersList[i].cards[1]) {
        setSelectedPosition({ playerIndex: i, cardIndex: 1 });
        return;
      }
    }
    
    for (let i = 0; i < community.length; i++) {
      if (!community[i]) {
        setSelectedPosition({ type: 'community', cardIndex: i });
        return;
      }
    }
    
    setSelectedPosition(null);
  };

  const clearAll = () => {
    const defaultPlayers: Player[] = [
      { id: '1', name: 'Player 1', cards: [null, null] },
      { id: '2', name: 'Player 2', cards: [null, null] }
    ];
    const defaultCommunityCards: (Card | null)[] = [null, null, null, null, null];
    
    setPlayers(defaultPlayers);
    setCommunityCards(defaultCommunityCards);
    setOdds([]);
    setSelectedPosition({ playerIndex: 0, cardIndex: 0 });
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('poker-odds-players');
        localStorage.removeItem('poker-odds-community-cards');
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  };

  const addPlayer = () => {
    const newId = (Math.max(...players.map(p => Number.parseInt(p.id)), 0) + 1).toString();
    setPlayers([...players, { 
      id: newId, 
      name: `Player ${newId}`, 
      cards: [null, null] 
    }]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return;
    
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
    
    setSelectedPosition({ playerIndex: 0, cardIndex: 0 });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      <GitHubLink />

      <main className="container mx-auto px-4 py-8 max-w-[1800px]">
        <div className="mb-6">
          <div className="text-center mb-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              Poker Equity Calculator
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-3">
              {players.map((player, playerIndex) => {
                const playerOdds = odds.find(o => o.playerId === player.id);
                const hasCompleteHand = player.cards[0] && player.cards[1];
                const playerColor = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
                
                return (
                  <div 
                    key={player.id} 
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                    style={{ borderLeftWidth: '6px', borderLeftColor: playerColor }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: playerColor }}
                          />
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[90px]">
                            {player.name}:
                          </h2>
                        </div>
                        <div className="flex gap-2">
                          <div className={`${selectedPosition && 'playerIndex' in selectedPosition && selectedPosition.playerIndex === playerIndex && selectedPosition.cardIndex === 0 ? 'ring-4 ring-blue-500 rounded-lg' : ''}`}>
                            <CardDisplay
                              card={player.cards[0]}
                              onClick={() => {
                                if (player.cards[0]) {
                                  handleCardRemove({ playerIndex, cardIndex: 0 });
                                } else {
                                  setSelectedPosition({ playerIndex, cardIndex: 0 });
                                }
                              }}
                              isSelectable={true}
                            />
                          </div>
                          <div className={`${selectedPosition && 'playerIndex' in selectedPosition && selectedPosition.playerIndex === playerIndex && selectedPosition.cardIndex === 1 ? 'ring-4 ring-blue-500 rounded-lg' : ''}`}>
                            <CardDisplay
                              card={player.cards[1]}
                              onClick={() => {
                                if (player.cards[1]) {
                                  handleCardRemove({ playerIndex, cardIndex: 1 });
                                } else {
                                  setSelectedPosition({ playerIndex, cardIndex: 1 });
                                }
                              }}
                              isSelectable={true}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {hasCompleteHand && playerOdds && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {(playerOdds.winPercentage + playerOdds.tiePercentage).toFixed(1)}%
                            </div>
                            {playerOdds.tiePercentage > 0.1 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                (Win: {playerOdds.winPercentage.toFixed(1)}% + Tie: {playerOdds.tiePercentage.toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        )}
                        {players.length > 2 && (
                          <button
                            onClick={() => removePlayer(playerIndex)}
                            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[90px]">
                  Board:
                </h2>
                <div className="flex gap-2">
                  {communityCards.map((card, index) => (
                    <div 
                      key={index}
                      className={`${selectedPosition && 'type' in selectedPosition && selectedPosition.type === 'community' && selectedPosition.cardIndex === index ? 'ring-4 ring-blue-500 rounded-lg' : ''}`}
                    >
                      <CardDisplay
                        card={card}
                        onClick={() => {
                          if (card) {
                            handleCardRemove({ type: 'community', cardIndex: index });
                          } else {
                            setSelectedPosition({ type: 'community', cardIndex: index });
                          }
                        }}
                        isSelectable={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addPlayer}
                disabled={players.length >= 9}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
              >
                + Add Player
              </button>
              <button
                onClick={clearAll}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm p-4">
              <p className="text-center text-base text-gray-700 dark:text-gray-300 mb-3 font-semibold">
                {selectedPosition && 'type' in selectedPosition && selectedPosition.type === 'community' 
                  ? `Community Card ${selectedPosition.cardIndex + 1}`
                  : selectedPosition && 'playerIndex' in selectedPosition
                  ? `${players[selectedPosition.playerIndex].name} - Card ${selectedPosition.cardIndex + 1}`
                  : 'Select a card'}
              </p>
              <CardSelectorGrid
                usedCards={usedCards}
                onCardSelect={handleCardSelect}
              />
            </div>

            <PieChart
              data={
                odds.length === 0 
                  ? [{ label: 'Tie', value: 100, color: '#64748B' }]
                  : isSingleHandMode
                    ? [
                        {
                          label: odds[0].playerName.split(' vs ')[0],
                          value: odds[0].winPercentage,
                          color: PLAYER_COLORS[0]
                        },
                        ...(odds[0].tiePercentage > 0.1 ? [{
                          label: 'Tie',
                          value: odds[0].tiePercentage,
                          color: '#64748B'
                        }] : []),
                        {
                          label: 'Opponent Wins',
                          value: 100 - odds[0].winPercentage - odds[0].tiePercentage,
                          color: '#475569'
                        }
                      ]
                    : [
                        ...odds.map((playerOdds, index) => ({
                          label: playerOdds.playerName,
                          value: playerOdds.winPercentage,
                          color: PLAYER_COLORS[players.findIndex(p => p.id === playerOdds.playerId) % PLAYER_COLORS.length]
                        })),
                        ...(odds.length > 0 && odds[0].tiePercentage > 0.1 ? [{
                          label: 'Tie',
                          value: odds[0].tiePercentage,
                          color: '#64748B'
                        }] : [])
                      ]
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
