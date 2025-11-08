'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Player, Card, OddsResult } from '@/lib/types';
import CardDisplay from '@/components/CardDisplay';
import CardSelectorGrid from '@/components/CardSelectorGrid';
import PieChart from '@/components/PieChart';
import ThemeToggle from '@/components/ThemeToggle';
import { calculateOdds, calculateHandStrength } from '@/lib/calculator';

type CardPosition =
  | { playerIndex: number; cardIndex: 0 | 1 }
  | { type: 'community'; cardIndex: number }
  | null;

// Player colors - distinct palette
const PLAYER_COLORS = [
  '#2563EB', '#DC2626', '#059669', '#D97706',
  '#7C3AED', '#DB2777', '#0891B2', '#EA580C', '#4F46E5',
];

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', cards: [null, null] },
    { id: '2', name: 'Player 2', cards: [null, null] },
  ]);
  const [communityCards, setCommunityCards] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [odds, setOdds] = useState<OddsResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<CardPosition>({ playerIndex: 0, cardIndex: 0 });
  const [betAmount, setBetAmount] = useState(100);
  const [isLoaded, setIsLoaded] = useState(false);

  // ---------- Load/save localStorage ----------
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedPlayers = localStorage.getItem('poker-odds-players');
        const cachedCommunityCards = localStorage.getItem('poker-odds-community-cards');
        if (cachedPlayers) setPlayers(JSON.parse(cachedPlayers));
        if (cachedCommunityCards) setCommunityCards(JSON.parse(cachedCommunityCards));
      } catch (err) {
        console.error('Error loading cache:', err);
      }
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('poker-odds-players', JSON.stringify(players));
    } catch {}
  }, [players, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('poker-odds-community-cards', JSON.stringify(communityCards));
    } catch {}
  }, [communityCards, isLoaded]);

  // ---------- Derived data ----------
  const usedCards = useMemo(() => {
    const cards: (Card | null)[] = [];
    for (const p of players) cards.push(p.cards[0], p.cards[1]);
    cards.push(...communityCards);
    return cards;
  }, [players, communityCards]);

  const validPlayers = useMemo(() => players.filter(p => p.cards[0] && p.cards[1]), [players]);
  const isSingleHandMode = validPlayers.length === 1;

  // ---------- Auto odds calculation ----------
  useEffect(() => {
    const filled = players.filter(p => p.cards[0] && p.cards[1]);
    if (filled.length === 0) {
      setOdds([]);
      return;
    }

    setIsCalculating(true);
    const timer = setTimeout(() => {
      if (filled.length === 1) {
        // Single player vs random opponents
        const player = filled[0];
        const numOpponents = players.length - 1;
        const result = calculateHandStrength(
          [player.cards[0]!, player.cards[1]!],
          communityCards,
          numOpponents,
          2000
        );
        setOdds([
          {
            playerId: player.id,
            playerName: `${player.name} vs ${numOpponents} opponent${numOpponents > 1 ? 's' : ''}`,
            winPercentage: result.winPercentage,
            tiePercentage: result.tiePercentage,
          },
        ]);
      } else {
        // Multi-player mode
        const result = calculateOdds(players, communityCards, 2000, betAmount);
        setOdds(result);
      }
      setIsCalculating(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [players, communityCards, betAmount]);

  // ---------- Card handling ----------
  const handleCardSelect = (card: Card) => {
    if (!selectedPosition) return;
    if ('type' in selectedPosition && selectedPosition.type === 'community') {
      const next = [...communityCards];
      next[selectedPosition.cardIndex] = card;
      setCommunityCards(next);
      setTimeout(() => findNextEmptySlot(next, players), 0);
    } else if ('playerIndex' in selectedPosition) {
      const nextPlayers = [...players];
      nextPlayers[selectedPosition.playerIndex].cards[selectedPosition.cardIndex] = card;
      setPlayers(nextPlayers);
      setTimeout(() => findNextEmptySlot(communityCards, nextPlayers), 0);
    }
  };

  const handleCardRemove = (pos: CardPosition) => {
    if (!pos) return;
    if ('type' in pos && pos.type === 'community') {
      const next = [...communityCards];
      next[pos.cardIndex] = null;
      setCommunityCards(next);
    } else if ('playerIndex' in pos) {
      const next = [...players];
      next[pos.playerIndex].cards[pos.cardIndex] = null;
      setPlayers(next);
    }
    setSelectedPosition(pos);
  };

    const findNextEmptySlot = (community: (Card | null)[] = communityCards, playerList: Player[] = players) => {
      for (let i = 0; i < playerList.length; i++) {
        if (!playerList[i].cards[0]) return setSelectedPosition({ playerIndex: i, cardIndex: 0 });
        if (!playerList[i].cards[1]) return setSelectedPosition({ playerIndex: i, cardIndex: 1 });
      }
        for (let i = 0; i < community.length; i++) 
          {
          if (!community[i]) return setSelectedPosition({ type: 'community', cardIndex: i });
          }
      };
  
    // Temporary placeholder render to close the Home component; replace with your actual JSX UI.
    return null;
  }