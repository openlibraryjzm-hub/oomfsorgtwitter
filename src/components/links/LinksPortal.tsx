'use client';

import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Globe, 
  X, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Camera,
  Pencil,
  Upload,
  Search,
  ExternalLink
} from 'lucide-react';
import { BioLink, User } from '@/lib/mockData';

// --- PLATFORM ICONS (Crisp Vector SVGs) ---

export function DiscordIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function XIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function TwitchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  );
}

export function KickIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 2h6v6h2.5l4.5-6H22l-6.5 8.5L22 22h-6l-4.5-6.5L9 18v4H3V2z" />
    </svg>
  );
}

export function YouTubeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function SteamIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0zM7.544 18.21c-.417 0-.756-.34-.756-.757 0-.417.339-.757.756-.757.418 0 .757.34.757.757 0 .417-.34.757-.757.757zm8.396-8.232c0-1.635-1.33-2.966-2.966-2.966-1.635 0-2.965 1.33-2.965 2.966 0 1.636 1.33 2.966 2.965 2.966 1.636 0 2.966-1.33 2.966-2.966z" />
    </svg>
  );
}

export function RobloxIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5.166 0L0 18.834 18.834 24 24 5.166 5.166 0zm9.083 14.542l-4.292-1.167 1.167-4.292 4.292 1.167-1.167 4.292z" />
    </svg>
  );
}

export function RedditIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25C10.5 12.56 9.94 12 9.25 12zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.466 3.99a.327.327 0 0 0-.231.096.327.327 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

export function TikTokIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.8-.8 1.4-1.8 1.4-3.87V8.75a8.16 8.16 0 0 0 4.33 1.39V6.69z" />
    </svg>
  );
}

export function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function BlueskyIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566 1.01 1.236 1.768 1.236 3.69c0 1.923.633 8.354 1.088 10.207.72 2.932 3.298 3.684 5.676 3.27-3.528 1.344-4.417 4.29-2.477 6.303 2.87 2.978 5.753-.559 6.477-3.085.724 2.526 3.607 6.063 6.477 3.085 1.94-2.013 1.05-4.959-2.477-6.303 2.378.414 4.956-.338 5.676-3.27.455-1.853 1.088-8.284 1.088-10.207 0-1.922-1.33-2.68-3.966-.885C16.046 4.747 13.087 8.686 12 10.8z" />
    </svg>
  );
}

export function TelegramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
    </svg>
  );
}

export function GitHubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function SpotifyIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function SoundCloudIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M1.175 12.225c-.04 0-.075.035-.075.075v4.55c0 .04.035.075.075.075s.075-.035.075-.075V12.3c0-.04-.035-.075-.075-.075zm1.15-.95c-.04 0-.075.035-.075.075v6.45c0 .04.035.075.075.075s.075-.035.075-.075v-6.45c0-.04-.035-.075-.075-.075zm1.15-1.25c-.04 0-.075.035-.075.075v8.95c0 .04.035.075.075.075s.075-.035.075-.075v-8.95c0-.04-.035-.075-.075-.075zm1.15-.35c-.04 0-.075.035-.075.075v9.65c0 .04.035.075.075.075s.075-.035.075-.075V9.75c0-.04-.035-.075-.075-.075zm1.15-.2c-.04 0-.075.035-.075.075v10.05c0 .04.035.075.075.075s.075-.035.075-.075V9.55c0-.04-.035-.075-.075-.075zm1.15-.15c-.04 0-.075.035-.075.075v10.35c0 .04.035.075.075.075s.075-.035.075-.075V9.4c0-.04-.035-.075-.075-.075zm1.15-.05c-.04 0-.075.035-.075.075v10.45c0 .04.035.075.075.075s.075-.035.075-.075V9.35c0-.04-.035-.075-.075-.075zm1.15.1c-.04 0-.075.035-.075.075v10.25c0 .04.035.075.075.075s.075-.035.075-.075V9.45c0-.04-.035-.075-.075-.075zm1.15.15c-.04 0-.075.035-.075.075v9.95c0 .04.035.075.075.075s.075-.035.075-.075V9.6c0-.04-.035-.075-.075-.075zm1.15.2c-.04 0-.075.035-.075.075v9.55c0 .04.035.075.075.075s.075-.035.075-.075V9.8c0-.04-.035-.075-.075-.075zm3.7-2.65c-.2 0-.4.025-.6.05-.25-.95-1.1-1.65-2.1-1.65-.25 0-.5.05-.7.15v13.55c.4.1.8.15 1.25.15h6.6c2.5 0 4.5-2 4.5-4.5s-2-4.5-4.5-4.5c-.3 0-.6.05-.85.1-.3-1.85-1.9-3.25-3.6-3.25z" />
    </svg>
  );
}

export function PatreonIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.957 7.21c-.004-3.064-2.39-5.57-5.188-6.182-3.61-.79-7.587 1.13-8.828 4.67-1.414 4.032.552 8.784 4.418 10.216 3.42 1.267 7.625-.13 9.07-3.58.55-1.313.53-3.69.528-5.124M.5 23.5h4.22V.5H.5v23z" />
    </svg>
  );
}

export function KofiIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.441 1.764 4.398 4.195 4.398h8.847c3.87 0 6.643-3.087 6.643-3.087s3.87-.27 4.543-3.82c.674-3.55.056-5.518-.369-5.518zm-4.321 4.745c-.29 1.487-1.742 1.623-1.742 1.623V7.279s1.393-.162 1.83 1.488c.437 1.65.202 4.926-.088 4.926z" />
    </svg>
  );
}

export function EpicGamesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0l9 2.5v12.2c0 4.6-4.5 7.9-9 9.3-4.5-1.4-9-4.7-9-9.3V2.5L12 0zm-1.5 5.5v2.8h3V11h-3v4.7H14V18H7.5V5.5h3z" />
    </svg>
  );
}

export function PlayStationIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8.9 9.3v8.5l3.2 1.4V5.7c0-.7-.5-1.2-1.3-1.1-1.3.1-1.9 1.1-1.9 2v2.7zm4.8 6.4c-1.3.6-2.9.8-4.4.8-2.6 0-4.3-.8-4.3-2.1 0-1.1 1.2-1.9 3.2-2.3l2.3-.4v-1.6l-2.4.4c-2.8.5-4.7 1.7-4.7 3.5 0 2.2 2.8 3.5 6.2 3.5 2 0 3.7-.5 4.8-1.2l-.7-.6zm9-1.9c-.3-.9-1.5-1.5-3.3-1.8l-3.3-.5 1.5 2.1 2.3.4c.9.1 1.5.4 1.6.8.1.4-.4.8-1.3.8-1.3 0-2.8-.5-4.2-1.3l-.7.9c1.5 1 3.2 1.5 4.8 1.5 2.2 0 3.3-1.3 2.6-2.9z" />
    </svg>
  );
}

export function XboxIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.2 17.5c-1.4 1.4-3.2 2.3-5.2 2.3s-3.8-.9-5.2-2.3c-.6-.6-.5-1.1.2-1.5 1.6-.9 3.3-1.4 5-1.4s3.4.5 5 1.4c.7.4.8.9.2 1.5zm2.6-2.5c-.8.8-1.7 1.4-2.8 1.8-1.5-.9-3.2-1.5-5-1.5s-3.5.6-5 1.5c-1.1-.4-2-1-2.8-1.8-.8-.8-1-1.4-.6-2.3 1.2-2.7 3.7-4.8 6.6-5.5-.6.8-1 1.7-1.2 2.7 1-.7 2.1-1.1 3.2-1.1s2.2.4 3.2 1.1c-.2-1-.6-1.9-1.2-2.7 2.9.7 5.4 2.8 6.6 5.5.4.9.2 1.5-.6 2.3z" />
    </svg>
  );
}

export function NintendoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.8 19.2H6.6c-2.4 0-4.2-1.8-4.2-4.2V9c0-2.4 1.8-4.2 4.2-4.2h3.6v14.4zm2.4 0v-14.4h3.6c2.4 0 4.2 1.8 4.2 4.2v6c0 2.4-1.8 4.2-4.2 4.2h-3.6zm-4.2-9.6c-.994 0-1.8-.806-1.8-1.8s.806-1.8 1.8-1.8 1.8.806 1.8 1.8-.806 1.8-1.8 1.8zm6 6c-.994 0-1.8-.806-1.8-1.8s.806-1.8 1.8-1.8 1.8.806 1.8 1.8-.806 1.8-1.8 1.8z" />
    </svg>
  );
}

export function BattleNetIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0L1.6 6v12L12 24l10.4-6V6L12 0zm-1.2 17.5l-5.6-3.2 2.2-3.8 3.4 2v5zm6.8-4.4l-5.6 3.2v-5l3.4-2 2.2 3.8zM12 5.3l5.6 3.2-2.2 3.8-3.4-2V5.3z" />
    </svg>
  );
}

export function RiotGamesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.7 2.3l-9.8 4.6 2.8 12.8 3.5-.8-.7-4.2 1.8-.4.6 3.8 3.3-.8-1.4-8.8 3.8-.9-3.4-5.1zm4.7 6.1l-1.3 7.8 2.7-.6 1.3-7.8-2.7.6z" />
    </svg>
  );
}

export function ChessIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a4 4 0 0 0-4 4c0 1.2.5 2.3 1.3 3L8 16h8l-1.3-7c.8-.7 1.3-1.8 1.3-3a4 4 0 0 0-4-4zm-6 16v4h12v-4H6z" />
    </svg>
  );
}

export function ThreadsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.2 13.8c-.2 1.8-1.6 3-3.8 3-2.6 0-4.4-1.8-4.4-4.6 0-2.8 1.9-4.7 4.7-4.7 2.4 0 3.8 1.3 4.2 3.1h-2c-.3-.9-1.1-1.4-2.2-1.4-1.6 0-2.6 1.2-2.6 3s1 3 2.5 3c1.2 0 2-.6 2.2-1.4h1.4z" />
    </svg>
  );
}

export function PinterestIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 4.9 3 9.1 7.3 10.8-.1-.9-.2-2.3 0-3.3l1.5-6.4s-.4-.8-.4-1.9c0-1.8 1-3.2 2.3-3.2 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1.1 4.2-.3 1.3.6 2.3 1.9 2.3 2.3 0 4.1-2.4 4.1-5.9 0-3.1-2.2-5.3-5.4-5.3-3.7 0-5.8 2.8-5.8 5.6 0 1.1.4 2.3 1 3 .1.1.1.2.1.3l-.4 1.5c0 .2-.2.3-.3.2-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.5 2.6 6.5 6.1 0 3.6-2.3 6.6-5.4 6.6-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2.9-.9 2.1-1.3 2.8 1.1.3 2.2.5 3.4.5 6.6 0 12-5.4 12-12S18.6 0 12 0z" />
    </svg>
  );
}

export function ArtStationIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M1.77 17.65L0 20.73h4.63l2.84-4.91L4.63 10.9 1.77 17.65zm7.3 3.08h13.16L18.9 15.1H9.07l2.84 5.63zm3.9-9.15l4.87-8.43h-4.63L8.38 10.1l2.84 4.92 1.75-3.44z" />
    </svg>
  );
}

export function DeviantArtIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.2 0h-4.3l-4.7 9H4.8v6h3.4l-1.3 9h4.3l4.7-9h5.4v-6h-3.4z" />
    </svg>
  );
}

export function BehanceIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 7h-7v2h7V7zm-11.4 5.2c1.3-.5 2-1.5 2-2.8 0-2.4-1.9-3.4-4.5-3.4H2v12h6.4c2.8 0 5-1.2 5-3.8 0-1.4-.7-2.6-2.8-3.2zM5.5 8h2.3c1.3 0 2.1.5 2.1 1.6 0 1-.8 1.6-2.1 1.6H5.5V8zm2.6 7H5.5v-3.4h2.6c1.5 0 2.4.6 2.4 1.7 0 1.2-.9 1.7-2.4 1.7zm11.5-2.8c-2.3 0-4.1 1.7-4.1 4.1 0 2.5 1.8 4.1 4.3 4.1 1.9 0 3.3-1 3.8-2.6h-2.1c-.3.6-.9.9-1.7.9-1.1 0-1.9-.7-2-1.8h6.1c.1-.2.1-.5.1-.7 0-2.3-1.6-4-4.4-4zm-1.8 3c.2-.9.8-1.5 1.8-1.5s1.6.6 1.8 1.5h-3.6z" />
    </svg>
  );
}

export function DribbbleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm8.38 8.64c-.45-.07-2.42-.35-4.7-.06-.1-.23-.2-.46-.31-.69-.47-.98-1-1.93-1.58-2.81 2.87.67 5.2 2.05 6.59 3.56zm-9.33-4.5c.57.86 1.09 1.77 1.54 2.73-2.65.8-5.3 1.01-5.74 1.04C7.8 5.75 9.3 4.49 11.05 4.14zm-6.9 5.38c.45-.03 3.66-.27 6.64-1.17.3.62.58 1.25.83 1.9-3.9 1.2-7.58 3.88-7.79 4.04-.5-1.4-.64-2.8-.5-4.22.28-.2.55-.38.82-.55zm2.08 7.33c.29-.21 3.58-2.64 7.37-3.79 1.07 2.84 1.54 5.56 1.63 6.13-1.07.45-2.25.7-3.48.7-2.15 0-4.1-.77-5.52-2.04zm11.08 1.15c-.13-.71-.62-3.23-1.63-5.91 2.14-.37 4.1.2 4.34.28-.31 2.37-1.37 4.46-2.71 5.63zm.88-7.39c-.31-.09-2.55-.73-4.94-.3.08-.18.15-.36.22-.54 1.93-.24 3.9-.03 4.72.08v.76z" />
    </svg>
  );
}

export function BuyMeACoffeeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.2 6.5h-2.4V4.7c0-1.5-1.2-2.7-2.7-2.7H5.9C4.4 2 3.2 3.2 3.2 4.7v9.4c0 3.3 2.7 6 6 6h2.2c3 0 5.6-2.2 6-5.1h2.8c2.1 0 3.8-1.7 3.8-3.8V9.3c0-1.6-1.3-2.8-3.8-2.8zm1.8 5.6c0 .9-.8 1.8-1.8 1.8h-2.5V8.5h2.5c1 0 1.8.8 1.8 1.8v1.8z" />
    </svg>
  );
}

export function SubstackIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.5 4.5H1.5V1.5h21v3zm0 7H1.5V8.5h21v3zm-21 7V24l10.5-6 10.5 6V18.5H1.5z" />
    </svg>
  );
}

export function FigmaIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4zm0-16h4V0H8C5.8 0 4 1.8 4 4s1.8 4 4 4zm0 8h4V8H8C5.8 8 4 9.8 4 12s1.8 4 4 4zm8-8c2.2 0 4-1.8 4-4s-1.8-4-4-4h-4v8h4zm0 8c2.2 0 4-1.8 4-4s-1.8-4-4-4h-4v8h4z" />
    </svg>
  );
}

export function NotionIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4.5 3.5l11.7-2.3c1.2-.2 2.2.6 2.3 1.8l1.4 17.5c.1 1.2-.7 2.2-1.9 2.4L6.3 25.2c-1.2.2-2.2-.6-2.3-1.8L2.6 5.9c-.1-1.2.7-2.2 1.9-2.4zm4.2 3.8L5.9 7.8v11.5l2.6-.5V12l4.8 7.3h2.6V8.6l-2.6.5v6.5l-4.6-7.8z" />
    </svg>
  );
}

export function AppleMusicIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 6.7v7.1c0 1.9-1.5 3.4-3.4 3.4s-3.4-1.5-3.4-3.4 1.5-3.4 3.4-3.4c.5 0 1 .1 1.4.3V8.1L9.2 9.5v5.8c0 1.9-1.5 3.4-3.4 3.4S2.4 17.2 2.4 15.3s1.5-3.4 3.4-3.4c.5 0 1 .1 1.4.3V8.2c0-.9.6-1.6 1.5-1.8l6.3-1.4c.8-.2 1.5.4 1.5 1.7z" />
    </svg>
  );
}

export function BandcampIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.677.15-.201.3-.777.978-.952 1.179-.176.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.798-1.498-1.784-1.674-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.3-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.927-2.233-.244-.587-.492-.507-.677-.517-.175-.009-.376-.01-.577-.01-.201 0-.527.075-.802.376-.276.301-1.053 1.028-1.053 2.508 0 1.48 1.078 2.909 1.229 3.109.15.2 2.121 3.238 5.138 4.542.718.31 1.279.496 1.716.635.721.23 1.377.197 1.896.12.577-.087 1.78-.727 2.031-1.43.25-.702.25-1.304.175-1.43-.075-.125-.276-.201-.577-.351zM12.04 2C6.496 2 2 6.496 2 12.04c0 1.802.481 3.557 1.396 5.097L2 22l5.006-1.314A10.005 10.005 0 0 0 12.04 22c5.544 0 10.04-4.496 10.04-10.04C22.08 6.496 17.584 2 12.04 2z" />
    </svg>
  );
}

export function LinkedInIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

// --- EXTENSIVE 35+ PLATFORM REGISTRY ---

export type PlatformCategory = 'gaming' | 'social' | 'video' | 'music' | 'art' | 'support' | 'dev' | 'custom';

export type PlatformType = 
  // Gaming
  | 'discord' | 'steam' | 'roblox' | 'epicgames' | 'playstation' | 'xbox' | 'nintendo' | 'battlenet' | 'riotgames' | 'chess'
  // Video & Stream
  | 'twitch' | 'kick' | 'youtube' | 'tiktok'
  // Social
  | 'x' | 'reddit' | 'bluesky' | 'threads' | 'instagram' | 'telegram' | 'whatsapp' | 'pinterest' | 'linkedin'
  // Music & Audio
  | 'spotify' | 'soundcloud' | 'applemusic' | 'bandcamp'
  // Art & Creative
  | 'artstation' | 'deviantart' | 'behance' | 'dribbble'
  // Support & Creator
  | 'patreon' | 'kofi' | 'buymeacoffee' | 'substack'
  // Dev & Tools
  | 'github' | 'figma' | 'notion'
  // Custom
  | 'custom';

export interface PlatformConfig {
  type: PlatformType;
  name: string;
  categoryTag: PlatformCategory;
  defaultActionLabel: string;
  defaultPlaceholderUrl: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconText: string;
  borderColor: string;
  hoverBorder: string;
  hoverBg: string;
  renderIcon: (className?: string) => React.ReactNode;
}

export const PLATFORM_REGISTRY: Record<PlatformType, PlatformConfig> = {
  // Gaming
  discord: {
    type: 'discord',
    name: 'Discord',
    categoryTag: 'gaming',
    defaultActionLabel: 'Join Server',
    defaultPlaceholderUrl: 'https://discord.gg/yourserver',
    badgeBg: 'bg-[#5865F2]/10',
    badgeText: 'text-[#5865F2]',
    iconBg: 'bg-[#5865F2]',
    iconText: 'text-white',
    borderColor: 'border-[#5865F2]/25',
    hoverBorder: 'hover:border-[#5865F2]',
    hoverBg: 'hover:bg-[#5865F2]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <DiscordIcon className={className} />
  },
  steam: {
    type: 'steam',
    name: 'Steam',
    categoryTag: 'gaming',
    defaultActionLabel: 'Steam Profile',
    defaultPlaceholderUrl: 'https://steamcommunity.com/id/yourprofile',
    badgeBg: 'bg-[#1b2838]/10',
    badgeText: 'text-[#1b2838]',
    iconBg: 'bg-[#1b2838]',
    iconText: 'text-white',
    borderColor: 'border-[#1b2838]/25',
    hoverBorder: 'hover:border-[#1b2838]',
    hoverBg: 'hover:bg-[#1b2838]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <SteamIcon className={className} />
  },
  roblox: {
    type: 'roblox',
    name: 'Roblox',
    categoryTag: 'gaming',
    defaultActionLabel: 'Roblox Profile',
    defaultPlaceholderUrl: 'https://roblox.com/users/youruserid/profile',
    badgeBg: 'bg-black/5',
    badgeText: 'text-[#0f1419]',
    iconBg: 'bg-[#0f1419]',
    iconText: 'text-white',
    borderColor: 'border-[#cfd9de]',
    hoverBorder: 'hover:border-[#0f1419]',
    hoverBg: 'hover:bg-black/[0.02]',
    renderIcon: (className = "w-4 h-4") => <RobloxIcon className={className} />
  },
  epicgames: {
    type: 'epicgames',
    name: 'Epic Games',
    categoryTag: 'gaming',
    defaultActionLabel: 'Epic Account',
    defaultPlaceholderUrl: 'https://store.epicgames.com/u/yourprofile',
    badgeBg: 'bg-black/5',
    badgeText: 'text-[#0f1419]',
    iconBg: 'bg-[#1a1a1a]',
    iconText: 'text-white',
    borderColor: 'border-[#cfd9de]',
    hoverBorder: 'hover:border-[#1a1a1a]',
    hoverBg: 'hover:bg-black/[0.02]',
    renderIcon: (className = "w-4 h-4") => <EpicGamesIcon className={className} />
  },
  playstation: {
    type: 'playstation',
    name: 'PlayStation',
    categoryTag: 'gaming',
    defaultActionLabel: 'PSN Profile',
    defaultPlaceholderUrl: 'https://my.playstation.com/profile/yourid',
    badgeBg: 'bg-[#003791]/10',
    badgeText: 'text-[#003791]',
    iconBg: 'bg-[#003791]',
    iconText: 'text-white',
    borderColor: 'border-[#003791]/25',
    hoverBorder: 'hover:border-[#003791]',
    hoverBg: 'hover:bg-[#003791]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <PlayStationIcon className={className} />
  },
  xbox: {
    type: 'xbox',
    name: 'Xbox',
    categoryTag: 'gaming',
    defaultActionLabel: 'Xbox Live',
    defaultPlaceholderUrl: 'https://account.xbox.com/profile?gamertag=yourtag',
    badgeBg: 'bg-[#107C10]/10',
    badgeText: 'text-[#107C10]',
    iconBg: 'bg-[#107C10]',
    iconText: 'text-white',
    borderColor: 'border-[#107C10]/25',
    hoverBorder: 'hover:border-[#107C10]',
    hoverBg: 'hover:bg-[#107C10]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <XboxIcon className={className} />
  },
  nintendo: {
    type: 'nintendo',
    name: 'Nintendo',
    categoryTag: 'gaming',
    defaultActionLabel: 'Friend Code',
    defaultPlaceholderUrl: 'https://nintendo.com',
    badgeBg: 'bg-[#E60012]/10',
    badgeText: 'text-[#E60012]',
    iconBg: 'bg-[#E60012]',
    iconText: 'text-white',
    borderColor: 'border-[#E60012]/25',
    hoverBorder: 'hover:border-[#E60012]',
    hoverBg: 'hover:bg-[#E60012]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <NintendoIcon className={className} />
  },
  battlenet: {
    type: 'battlenet',
    name: 'Battle.net',
    categoryTag: 'gaming',
    defaultActionLabel: 'BattleTag',
    defaultPlaceholderUrl: 'https://battle.net',
    badgeBg: 'bg-[#009AE4]/10',
    badgeText: 'text-[#009AE4]',
    iconBg: 'bg-[#009AE4]',
    iconText: 'text-white',
    borderColor: 'border-[#009AE4]/25',
    hoverBorder: 'hover:border-[#009AE4]',
    hoverBg: 'hover:bg-[#009AE4]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <BattleNetIcon className={className} />
  },
  riotgames: {
    type: 'riotgames',
    name: 'Riot Games',
    categoryTag: 'gaming',
    defaultActionLabel: 'Riot ID',
    defaultPlaceholderUrl: 'https://riotgames.com',
    badgeBg: 'bg-[#EB0029]/10',
    badgeText: 'text-[#EB0029]',
    iconBg: 'bg-[#EB0029]',
    iconText: 'text-white',
    borderColor: 'border-[#EB0029]/25',
    hoverBorder: 'hover:border-[#EB0029]',
    hoverBg: 'hover:bg-[#EB0029]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <RiotGamesIcon className={className} />
  },
  chess: {
    type: 'chess',
    name: 'Chess.com',
    categoryTag: 'gaming',
    defaultActionLabel: 'Challenge Me',
    defaultPlaceholderUrl: 'https://chess.com/member/yourusername',
    badgeBg: 'bg-[#81b64c]/10',
    badgeText: 'text-[#81b64c]',
    iconBg: 'bg-[#81b64c]',
    iconText: 'text-white',
    borderColor: 'border-[#81b64c]/25',
    hoverBorder: 'hover:border-[#81b64c]',
    hoverBg: 'hover:bg-[#81b64c]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <ChessIcon className={className} />
  },

  // Video & Stream
  twitch: {
    type: 'twitch',
    name: 'Twitch',
    categoryTag: 'video',
    defaultActionLabel: 'Watch Live',
    defaultPlaceholderUrl: 'https://twitch.tv/yourchannel',
    badgeBg: 'bg-[#9146FF]/10',
    badgeText: 'text-[#9146FF]',
    iconBg: 'bg-[#9146FF]',
    iconText: 'text-white',
    borderColor: 'border-[#9146FF]/25',
    hoverBorder: 'hover:border-[#9146FF]',
    hoverBg: 'hover:bg-[#9146FF]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <TwitchIcon className={className} />
  },
  kick: {
    type: 'kick',
    name: 'Kick',
    categoryTag: 'video',
    defaultActionLabel: 'Watch on Kick',
    defaultPlaceholderUrl: 'https://kick.com/yourchannel',
    badgeBg: 'bg-[#53FC18]/15',
    badgeText: 'text-[#209400]',
    iconBg: 'bg-[#000000]',
    iconText: 'text-[#53FC18]',
    borderColor: 'border-[#53FC18]/30',
    hoverBorder: 'hover:border-[#53FC18]',
    hoverBg: 'hover:bg-[#53FC18]/[0.03]',
    renderIcon: (className = "w-4 h-4") => <KickIcon className={className} />
  },
  youtube: {
    type: 'youtube',
    name: 'YouTube',
    categoryTag: 'video',
    defaultActionLabel: 'Subscribe',
    defaultPlaceholderUrl: 'https://youtube.com/@yourchannel',
    badgeBg: 'bg-[#FF0000]/10',
    badgeText: 'text-[#FF0000]',
    iconBg: 'bg-[#FF0000]',
    iconText: 'text-white',
    borderColor: 'border-[#FF0000]/25',
    hoverBorder: 'hover:border-[#FF0000]',
    hoverBg: 'hover:bg-[#FF0000]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <YouTubeIcon className={className} />
  },
  tiktok: {
    type: 'tiktok',
    name: 'TikTok',
    categoryTag: 'video',
    defaultActionLabel: 'Follow on TikTok',
    defaultPlaceholderUrl: 'https://tiktok.com/@yourusername',
    badgeBg: 'bg-black/5',
    badgeText: 'text-[#0f1419]',
    iconBg: 'bg-[#000000]',
    iconText: 'text-white',
    borderColor: 'border-black/20',
    hoverBorder: 'hover:border-[#000000]',
    hoverBg: 'hover:bg-black/[0.02]',
    renderIcon: (className = "w-4 h-4") => <TikTokIcon className={className} />
  },

  // Social
  x: {
    type: 'x',
    name: 'X (Twitter)',
    categoryTag: 'social',
    defaultActionLabel: 'Follow on 𝕏',
    defaultPlaceholderUrl: 'https://x.com/yourhandle',
    badgeBg: 'bg-black/5',
    badgeText: 'text-[#0f1419]',
    iconBg: 'bg-[#0f1419]',
    iconText: 'text-white',
    borderColor: 'border-[#cfd9de]',
    hoverBorder: 'hover:border-[#0f1419]',
    hoverBg: 'hover:bg-[#0f1419]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <XIcon className={className} />
  },
  reddit: {
    type: 'reddit',
    name: 'Reddit',
    categoryTag: 'social',
    defaultActionLabel: 'Reddit Profile',
    defaultPlaceholderUrl: 'https://reddit.com/u/yourusername',
    badgeBg: 'bg-[#FF4500]/10',
    badgeText: 'text-[#FF4500]',
    iconBg: 'bg-[#FF4500]',
    iconText: 'text-white',
    borderColor: 'border-[#FF4500]/25',
    hoverBorder: 'hover:border-[#FF4500]',
    hoverBg: 'hover:bg-[#FF4500]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <RedditIcon className={className} />
  },
  bluesky: {
    type: 'bluesky',
    name: 'Bluesky',
    categoryTag: 'social',
    defaultActionLabel: 'Follow on Bluesky',
    defaultPlaceholderUrl: 'https://bsky.app/profile/yourhandle.bsky.social',
    badgeBg: 'bg-[#1185FE]/10',
    badgeText: 'text-[#1185FE]',
    iconBg: 'bg-[#1185FE]',
    iconText: 'text-white',
    borderColor: 'border-[#1185FE]/25',
    hoverBorder: 'hover:border-[#1185FE]',
    hoverBg: 'hover:bg-[#1185FE]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <BlueskyIcon className={className} />
  },
  threads: {
    type: 'threads',
    name: 'Threads',
    categoryTag: 'social',
    defaultActionLabel: 'Follow on Threads',
    defaultPlaceholderUrl: 'https://threads.net/@yourhandle',
    badgeBg: 'bg-black/5',
    badgeText: 'text-[#0f1419]',
    iconBg: 'bg-[#0f1419]',
    iconText: 'text-white',
    borderColor: 'border-[#cfd9de]',
    hoverBorder: 'hover:border-[#0f1419]',
    hoverBg: 'hover:bg-black/[0.02]',
    renderIcon: (className = "w-4 h-4") => <ThreadsIcon className={className} />
  },
  instagram: {
    type: 'instagram',
    name: 'Instagram',
    categoryTag: 'social',
    defaultActionLabel: 'Follow on Instagram',
    defaultPlaceholderUrl: 'https://instagram.com/yourusername',
    badgeBg: 'bg-[#E4405F]/10',
    badgeText: 'text-[#E4405F]',
    iconBg: 'bg-gradient-to-tr from-[#FFDC80] via-[#E4405F] to-[#833AB4]',
    iconText: 'text-white',
    borderColor: 'border-[#E4405F]/25',
    hoverBorder: 'hover:border-[#E4405F]',
    hoverBg: 'hover:bg-[#E4405F]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <InstagramIcon className={className} />
  },
  telegram: {
    type: 'telegram',
    name: 'Telegram',
    categoryTag: 'social',
    defaultActionLabel: 'Join Channel',
    defaultPlaceholderUrl: 'https://t.me/yourchannel',
    badgeBg: 'bg-[#26A5E4]/10',
    badgeText: 'text-[#26A5E4]',
    iconBg: 'bg-[#26A5E4]',
    iconText: 'text-white',
    borderColor: 'border-[#26A5E4]/25',
    hoverBorder: 'hover:border-[#26A5E4]',
    hoverBg: 'hover:bg-[#26A5E4]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <TelegramIcon className={className} />
  },
  whatsapp: {
    type: 'whatsapp',
    name: 'WhatsApp',
    categoryTag: 'social',
    defaultActionLabel: 'Message on WhatsApp',
    defaultPlaceholderUrl: 'https://wa.me/yournumber',
    badgeBg: 'bg-[#25D366]/10',
    badgeText: 'text-[#25D366]',
    iconBg: 'bg-[#25D366]',
    iconText: 'text-white',
    borderColor: 'border-[#25D366]/25',
    hoverBorder: 'hover:border-[#25D366]',
    hoverBg: 'hover:bg-[#25D366]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <WhatsAppIcon className={className} />
  },
  pinterest: {
    type: 'pinterest',
    name: 'Pinterest',
    categoryTag: 'social',
    defaultActionLabel: 'Follow on Pinterest',
    defaultPlaceholderUrl: 'https://pinterest.com/yourprofile',
    badgeBg: 'bg-[#E60023]/10',
    badgeText: 'text-[#E60023]',
    iconBg: 'bg-[#E60023]',
    iconText: 'text-white',
    borderColor: 'border-[#E60023]/25',
    hoverBorder: 'hover:border-[#E60023]',
    hoverBg: 'hover:bg-[#E60023]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <PinterestIcon className={className} />
  },
  linkedin: {
    type: 'linkedin',
    name: 'LinkedIn',
    categoryTag: 'social',
    defaultActionLabel: 'Connect on LinkedIn',
    defaultPlaceholderUrl: 'https://linkedin.com/in/yourprofile',
    badgeBg: 'bg-[#0077B5]/10',
    badgeText: 'text-[#0077B5]',
    iconBg: 'bg-[#0077B5]',
    iconText: 'text-white',
    borderColor: 'border-[#0077B5]/25',
    hoverBorder: 'hover:border-[#0077B5]',
    hoverBg: 'hover:bg-[#0077B5]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <LinkedInIcon className={className} />
  },

  // Music & Audio
  spotify: {
    type: 'spotify',
    name: 'Spotify',
    categoryTag: 'music',
    defaultActionLabel: 'Listen on Spotify',
    defaultPlaceholderUrl: 'https://open.spotify.com/user/yourid',
    badgeBg: 'bg-[#1DB954]/10',
    badgeText: 'text-[#1DB954]',
    iconBg: 'bg-[#1DB954]',
    iconText: 'text-white',
    borderColor: 'border-[#1DB954]/25',
    hoverBorder: 'hover:border-[#1DB954]',
    hoverBg: 'hover:bg-[#1DB954]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <SpotifyIcon className={className} />
  },
  soundcloud: {
    type: 'soundcloud',
    name: 'SoundCloud',
    categoryTag: 'music',
    defaultActionLabel: 'SoundCloud Tracks',
    defaultPlaceholderUrl: 'https://soundcloud.com/yourartist',
    badgeBg: 'bg-[#FF5500]/10',
    badgeText: 'text-[#FF5500]',
    iconBg: 'bg-[#FF5500]',
    iconText: 'text-white',
    borderColor: 'border-[#FF5500]/25',
    hoverBorder: 'hover:border-[#FF5500]',
    hoverBg: 'hover:bg-[#FF5500]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <SoundCloudIcon className={className} />
  },
  applemusic: {
    type: 'applemusic',
    name: 'Apple Music',
    categoryTag: 'music',
    defaultActionLabel: 'Listen on Apple',
    defaultPlaceholderUrl: 'https://music.apple.com/profile/yourid',
    badgeBg: 'bg-[#FA243C]/10',
    badgeText: 'text-[#FA243C]',
    iconBg: 'bg-[#FA243C]',
    iconText: 'text-white',
    borderColor: 'border-[#FA243C]/25',
    hoverBorder: 'hover:border-[#FA243C]',
    hoverBg: 'hover:bg-[#FA243C]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <AppleMusicIcon className={className} />
  },
  bandcamp: {
    type: 'bandcamp',
    name: 'Bandcamp',
    categoryTag: 'music',
    defaultActionLabel: 'Buy on Bandcamp',
    defaultPlaceholderUrl: 'https://yourname.bandcamp.com',
    badgeBg: 'bg-[#629AA9]/10',
    badgeText: 'text-[#1B5262]',
    iconBg: 'bg-[#629AA9]',
    iconText: 'text-white',
    borderColor: 'border-[#629AA9]/25',
    hoverBorder: 'hover:border-[#629AA9]',
    hoverBg: 'hover:bg-[#629AA9]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <BandcampIcon className={className} />
  },

  // Art & Creative
  artstation: {
    type: 'artstation',
    name: 'ArtStation',
    categoryTag: 'art',
    defaultActionLabel: 'Art Portfolio',
    defaultPlaceholderUrl: 'https://artstation.com/yourname',
    badgeBg: 'bg-[#13AFF0]/10',
    badgeText: 'text-[#13AFF0]',
    iconBg: 'bg-[#13AFF0]',
    iconText: 'text-white',
    borderColor: 'border-[#13AFF0]/25',
    hoverBorder: 'hover:border-[#13AFF0]',
    hoverBg: 'hover:bg-[#13AFF0]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <ArtStationIcon className={className} />
  },
  deviantart: {
    type: 'deviantart',
    name: 'DeviantArt',
    categoryTag: 'art',
    defaultActionLabel: 'DeviantArt Gallery',
    defaultPlaceholderUrl: 'https://deviantart.com/yourname',
    badgeBg: 'bg-[#05CC47]/10',
    badgeText: 'text-[#049634]',
    iconBg: 'bg-[#05CC47]',
    iconText: 'text-white',
    borderColor: 'border-[#05CC47]/25',
    hoverBorder: 'hover:border-[#05CC47]',
    hoverBg: 'hover:bg-[#05CC47]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <DeviantArtIcon className={className} />
  },
  behance: {
    type: 'behance',
    name: 'Behance',
    categoryTag: 'art',
    defaultActionLabel: 'Behance Showcase',
    defaultPlaceholderUrl: 'https://behance.net/yourprofile',
    badgeBg: 'bg-[#1769FF]/10',
    badgeText: 'text-[#1769FF]',
    iconBg: 'bg-[#1769FF]',
    iconText: 'text-white',
    borderColor: 'border-[#1769FF]/25',
    hoverBorder: 'hover:border-[#1769FF]',
    hoverBg: 'hover:bg-[#1769FF]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <BehanceIcon className={className} />
  },
  dribbble: {
    type: 'dribbble',
    name: 'Dribbble',
    categoryTag: 'art',
    defaultActionLabel: 'Dribbble Shots',
    defaultPlaceholderUrl: 'https://dribbble.com/yourprofile',
    badgeBg: 'bg-[#EA4C89]/10',
    badgeText: 'text-[#EA4C89]',
    iconBg: 'bg-[#EA4C89]',
    iconText: 'text-white',
    borderColor: 'border-[#EA4C89]/25',
    hoverBorder: 'hover:border-[#EA4C89]',
    hoverBg: 'hover:bg-[#EA4C89]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <DribbbleIcon className={className} />
  },

  // Support & Creator
  patreon: {
    type: 'patreon',
    name: 'Patreon',
    categoryTag: 'support',
    defaultActionLabel: 'Support on Patreon',
    defaultPlaceholderUrl: 'https://patreon.com/yourcreator',
    badgeBg: 'bg-[#FF424D]/10',
    badgeText: 'text-[#FF424D]',
    iconBg: 'bg-[#FF424D]',
    iconText: 'text-white',
    borderColor: 'border-[#FF424D]/25',
    hoverBorder: 'hover:border-[#FF424D]',
    hoverBg: 'hover:bg-[#FF424D]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <PatreonIcon className={className} />
  },
  kofi: {
    type: 'kofi',
    name: 'Ko-fi',
    categoryTag: 'support',
    defaultActionLabel: 'Tip on Ko-fi',
    defaultPlaceholderUrl: 'https://ko-fi.com/yourhandle',
    badgeBg: 'bg-[#FF5E5B]/10',
    badgeText: 'text-[#FF5E5B]',
    iconBg: 'bg-[#FF5E5B]',
    iconText: 'text-white',
    borderColor: 'border-[#FF5E5B]/25',
    hoverBorder: 'hover:border-[#FF5E5B]',
    hoverBg: 'hover:bg-[#FF5E5B]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <KofiIcon className={className} />
  },
  buymeacoffee: {
    type: 'buymeacoffee',
    name: 'Buy Me a Coffee',
    categoryTag: 'support',
    defaultActionLabel: 'Buy me a Coffee',
    defaultPlaceholderUrl: 'https://buymeacoffee.com/yourname',
    badgeBg: 'bg-[#FFDD00]/20',
    badgeText: 'text-[#8A7700]',
    iconBg: 'bg-[#FFDD00]',
    iconText: 'text-black',
    borderColor: 'border-[#FFDD00]/40',
    hoverBorder: 'hover:border-[#FFDD00]',
    hoverBg: 'hover:bg-[#FFDD00]/[0.03]',
    renderIcon: (className = "w-4 h-4") => <BuyMeACoffeeIcon className={className} />
  },
  substack: {
    type: 'substack',
    name: 'Substack',
    categoryTag: 'support',
    defaultActionLabel: 'Read on Substack',
    defaultPlaceholderUrl: 'https://yourname.substack.com',
    badgeBg: 'bg-[#FF6719]/10',
    badgeText: 'text-[#FF6719]',
    iconBg: 'bg-[#FF6719]',
    iconText: 'text-white',
    borderColor: 'border-[#FF6719]/25',
    hoverBorder: 'hover:border-[#FF6719]',
    hoverBg: 'hover:bg-[#FF6719]/[0.02]',
    renderIcon: (className = "w-4 h-4") => <SubstackIcon className={className} />
  },

  // Dev & Tools
  github: {
    type: 'github',
    name: 'GitHub',
    categoryTag: 'dev',
    defaultActionLabel: 'Repositories',
    defaultPlaceholderUrl: 'https://github.com/yourusername',
    badgeBg: 'bg-[#24292f]/10',
    badgeText: 'text-[#24292f]',
    iconBg: 'bg-[#24292f]',
    iconText: 'text-white',
    borderColor: 'border-[#24292f]/20',
    hoverBorder: 'hover:border-[#24292f]',
    hoverBg: 'hover:bg-[#24292f]/[0.02]',
    renderIcon: (className = "w-5 h-5") => <GitHubIcon className={className} />
  },
  figma: {
    type: 'figma',
    name: 'Figma',
    categoryTag: 'dev',
    defaultActionLabel: 'Figma Community',
    defaultPlaceholderUrl: 'https://figma.com/@yourhandle',
    badgeBg: 'bg-black/5',
    badgeText: 'text-[#0f1419]',
    iconBg: 'bg-[#1E1E1E]',
    iconText: 'text-white',
    borderColor: 'border-[#cfd9de]',
    hoverBorder: 'hover:border-[#1E1E1E]',
    hoverBg: 'hover:bg-black/[0.02]',
    renderIcon: (className = "w-4 h-4") => <FigmaIcon className={className} />
  },
  notion: {
    type: 'notion',
    name: 'Notion',
    categoryTag: 'dev',
    defaultActionLabel: 'Notion Page',
    defaultPlaceholderUrl: 'https://notion.site/yourpage',
    badgeBg: 'bg-black/5',
    badgeText: 'text-[#0f1419]',
    iconBg: 'bg-[#000000]',
    iconText: 'text-white',
    borderColor: 'border-[#cfd9de]',
    hoverBorder: 'hover:border-black',
    hoverBg: 'hover:bg-black/[0.02]',
    renderIcon: (className = "w-4 h-4") => <NotionIcon className={className} />
  },

  // Custom
  custom: {
    type: 'custom',
    name: 'Website / Custom',
    categoryTag: 'custom',
    defaultActionLabel: 'Visit',
    defaultPlaceholderUrl: 'https://yourwebsite.com',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-[#1d9bf0]',
    iconBg: 'bg-[#1d9bf0]',
    iconText: 'text-white',
    borderColor: 'border-[#eff3f4]',
    hoverBorder: 'hover:border-[#1d9bf0]/60',
    hoverBg: 'hover:bg-blue-50/20',
    renderIcon: (className = "w-5 h-5") => <Globe className={className} />
  }
};

export function detectPlatform(url: string, title?: string): PlatformType {
  const lower = (url || '').toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // Gaming
  if (lower.includes('discord.gg') || lower.includes('discord.com') || lowerTitle.includes('discord')) return 'discord';
  if (lower.includes('steamcommunity.com') || lower.includes('store.steampowered.com') || lowerTitle.includes('steam')) return 'steam';
  if (lower.includes('roblox.com') || lowerTitle.includes('roblox')) return 'roblox';
  if (lower.includes('epicgames.com') || lowerTitle.includes('epic games')) return 'epicgames';
  if (lower.includes('playstation.com') || lowerTitle.includes('playstation') || lowerTitle.includes('psn')) return 'playstation';
  if (lower.includes('xbox.com') || lowerTitle.includes('xbox')) return 'xbox';
  if (lower.includes('nintendo.com') || lowerTitle.includes('nintendo') || lowerTitle.includes('switch')) return 'nintendo';
  if (lower.includes('battle.net') || lower.includes('blizzard.com') || lowerTitle.includes('battle.net') || lowerTitle.includes('battlenet')) return 'battlenet';
  if (lower.includes('riotgames.com') || lowerTitle.includes('riot') || lowerTitle.includes('valorant')) return 'riotgames';
  if (lower.includes('chess.com') || lowerTitle.includes('chess')) return 'chess';

  // Video / Streaming
  if (lower.includes('twitch.tv') || lowerTitle.includes('twitch')) return 'twitch';
  if (lower.includes('kick.com') || lowerTitle.includes('kick')) return 'kick';
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lowerTitle.includes('youtube')) return 'youtube';
  if (lower.includes('tiktok.com') || lowerTitle.includes('tiktok')) return 'tiktok';

  // Social
  if (lower.includes('twitter.com') || lower.includes('x.com') || lowerTitle.includes('x profile') || lowerTitle.includes('twitter')) return 'x';
  if (lower.includes('reddit.com') || lowerTitle.includes('reddit')) return 'reddit';
  if (lower.includes('bsky.app') || lowerTitle.includes('bluesky')) return 'bluesky';
  if (lower.includes('threads.net') || lowerTitle.includes('threads')) return 'threads';
  if (lower.includes('instagram.com') || lowerTitle.includes('instagram') || lowerTitle.includes('insta')) return 'instagram';
  if (lower.includes('t.me') || lower.includes('telegram.me') || lowerTitle.includes('telegram')) return 'telegram';
  if (lower.includes('wa.me') || lower.includes('whatsapp.com') || lowerTitle.includes('whatsapp')) return 'whatsapp';
  if (lower.includes('pinterest.com') || lowerTitle.includes('pinterest')) return 'pinterest';
  if (lower.includes('linkedin.com') || lowerTitle.includes('linkedin')) return 'linkedin';

  // Music
  if (lower.includes('spotify.com') || lowerTitle.includes('spotify')) return 'spotify';
  if (lower.includes('soundcloud.com') || lowerTitle.includes('soundcloud')) return 'soundcloud';
  if (lower.includes('music.apple.com') || lowerTitle.includes('apple music')) return 'applemusic';
  if (lower.includes('bandcamp.com') || lowerTitle.includes('bandcamp')) return 'bandcamp';

  // Art
  if (lower.includes('artstation.com') || lowerTitle.includes('artstation')) return 'artstation';
  if (lower.includes('deviantart.com') || lowerTitle.includes('deviantart')) return 'deviantart';
  if (lower.includes('behance.net') || lowerTitle.includes('behance')) return 'behance';
  if (lower.includes('dribbble.com') || lowerTitle.includes('dribbble')) return 'dribbble';

  // Support
  if (lower.includes('patreon.com') || lowerTitle.includes('patreon')) return 'patreon';
  if (lower.includes('ko-fi.com') || lowerTitle.includes('ko-fi') || lowerTitle.includes('kofi')) return 'kofi';
  if (lower.includes('buymeacoffee.com') || lowerTitle.includes('coffee')) return 'buymeacoffee';
  if (lower.includes('substack.com') || lowerTitle.includes('substack')) return 'substack';

  // Dev
  if (lower.includes('github.com') || lowerTitle.includes('github')) return 'github';
  if (lower.includes('figma.com') || lowerTitle.includes('figma')) return 'figma';
  if (lower.includes('notion.site') || lower.includes('notion.so') || lowerTitle.includes('notion')) return 'notion';

  return 'custom';
}

// --- DEFAULT GAMER & X STARTER LINKS ---

export const DEFAULT_GAMER_LINKS: BioLink[] = [
  {
    id: 'link_discord_default',
    title: 'The OOMFS Hangout',
    subtitle: 'discord.gg/oomfs • 3,420 members online',
    url: 'https://discord.gg/oomfs',
    category: 'discord',
    actionLabel: 'Join Server'
  },
  {
    id: 'link_x_default',
    title: 'X / Twitter Main',
    subtitle: '@amberlyn • Thoughts, art & web design',
    url: 'https://x.com/amberlyn',
    category: 'x',
    actionLabel: 'Follow on 𝕏'
  },
  {
    id: 'link_twitch_default',
    title: 'Twitch Live Stream',
    subtitle: 'twitch.tv/amberlyn • UI Speedruns & Gaming',
    url: 'https://twitch.tv/amberlyn',
    category: 'twitch',
    actionLabel: 'Watch Live'
  },
  {
    id: 'link_youtube_default',
    title: 'YouTube Channel',
    subtitle: 'Design tutorials, breakdowns & dev logs',
    url: 'https://youtube.com/@amberlyn',
    category: 'youtube',
    actionLabel: 'Subscribe'
  },
  {
    id: 'link_steam_default',
    title: 'Steam Profile',
    subtitle: 'steamcommunity.com/id/amberlyn • Play with me',
    url: 'https://steamcommunity.com',
    category: 'steam',
    actionLabel: 'Steam Profile'
  },
  {
    id: 'link_reddit_default',
    title: 'Reddit Profile',
    subtitle: 'u/amberlyn_ui • Moderating r/oomfs',
    url: 'https://reddit.com/u/amberlyn',
    category: 'reddit',
    actionLabel: 'Reddit Profile'
  }
];

// --- MAIN LINKS PORTAL COMPONENT ---

interface LinksPortalProps {
  user: User;
  isSelf: boolean;
}

export default function LinksPortal({ user, isSelf }: LinksPortalProps) {
  const storageKey = `oomfs_profile_links_${user.id || user.username}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hydrate links with priority: localStorage -> user.links -> DEFAULT_GAMER_LINKS
  const [links, setLinks] = useState<BioLink[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.error('Error reading cached links:', err);
      }
    }
    if (user.links && user.links.length > 0) {
      return user.links;
    }
    if (user.username.toLowerCase() === 'amberlyn') {
      return DEFAULT_GAMER_LINKS;
    }
    return [];
  });

  // Modal creation/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1); // 1: Pick Platform/Logo, 2: Configure Details
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Form fields
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('discord');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkSubtitle, setLinkSubtitle] = useState('');
  const [linkActionLabel, setLinkActionLabel] = useState('');

  // Step 1 Search & Category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  const persistLinks = (nextLinks: BioLink[]) => {
    setLinks(nextLinks);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextLinks));
      } catch (err) {
        console.error('Error saving links to storage:', err);
      }
    }
  };

  const openAddModal = () => {
    setEditingLinkId(null);
    setSelectedPlatform('discord');
    setCustomLogoUrl(null);
    setLinkUrl('');
    setLinkTitle('Discord');
    setLinkSubtitle('');
    setLinkActionLabel(PLATFORM_REGISTRY.discord.defaultActionLabel);
    setSearchQuery('');
    setActiveCategoryFilter('all');
    setModalStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (link: BioLink) => {
    const pType = (link.category as PlatformType) || detectPlatform(link.url, link.title);
    setEditingLinkId(link.id);
    setSelectedPlatform(pType);
    setCustomLogoUrl(link.customIcon || null);
    setLinkUrl(link.url);
    setLinkTitle(link.title);
    setLinkSubtitle(link.subtitle || '');
    setLinkActionLabel(link.actionLabel || PLATFORM_REGISTRY[pType]?.defaultActionLabel || 'Visit');
    setModalStep(2); // Jump straight to edit details
    setIsModalOpen(true);
  };

  // Step 1: Select Platform Card & advance to Step 2
  const handleSelectPlatform = (pType: PlatformType) => {
    setSelectedPlatform(pType);
    const cfg = PLATFORM_REGISTRY[pType];
    if (!editingLinkId) {
      setLinkTitle(cfg.name === 'Website / Custom' ? '' : cfg.name);
      setLinkActionLabel(cfg.defaultActionLabel);
      if (!linkUrl) {
        setLinkUrl(cfg.defaultPlaceholderUrl);
      }
    } else {
      if (!linkActionLabel) {
        setLinkActionLabel(cfg.defaultActionLabel);
      }
    }
    setModalStep(2);
  };

  // Upload Custom Image handler (can be called in Step 1 or Step 2)
  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomLogoUrl(result);
      setSelectedPlatform('custom');
      if (!linkTitle && !editingLinkId) {
        setLinkTitle('My Link');
      }
      setModalStep(2);
    };
    reader.readAsDataURL(file);
  };

  // Save Link (Create or Update)
  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const cfg = PLATFORM_REGISTRY[selectedPlatform] || PLATFORM_REGISTRY.custom;
    const finalTitle = linkTitle.trim() || cfg.name;
    const finalAction = linkActionLabel.trim() || cfg.defaultActionLabel;

    if (editingLinkId) {
      const updated = links.map((l) => {
        if (l.id === editingLinkId) {
          return {
            ...l,
            title: finalTitle,
            subtitle: linkSubtitle.trim(),
            url: finalUrl,
            category: selectedPlatform,
            customIcon: customLogoUrl || undefined,
            actionLabel: finalAction
          };
        }
        return l;
      });
      persistLinks(updated);
    } else {
      const newLink: BioLink = {
        id: `link_${Date.now()}`,
        title: finalTitle,
        subtitle: linkSubtitle.trim() || finalUrl.replace(/^https?:\/\/(www\.)?/, ''),
        url: finalUrl,
        category: selectedPlatform,
        customIcon: customLogoUrl || undefined,
        actionLabel: finalAction
      };
      persistLinks([newLink, ...links]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteLink = (id: string) => {
    persistLinks(links.filter(l => l.id !== id));
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const nextIdx = direction === 'up' ? index - 1 : index + 1;
    if (nextIdx < 0 || nextIdx >= links.length) return;
    const copy = [...links];
    const temp = copy[index];
    copy[index] = copy[nextIdx];
    copy[nextIdx] = temp;
    persistLinks(copy);
  };

  // Filtered platforms for the dense grid
  const platformKeys = Object.keys(PLATFORM_REGISTRY) as PlatformType[];
  const filteredPlatforms = useMemo(() => {
    return platformKeys.filter((pKey) => {
      const cfg = PLATFORM_REGISTRY[pKey];
      // Category check
      if (activeCategoryFilter !== 'all' && cfg.categoryTag !== activeCategoryFilter) {
        return false;
      }
      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = cfg.name.toLowerCase().includes(q);
        const matchesType = cfg.type.toLowerCase().includes(q);
        const matchesCategory = cfg.categoryTag.toLowerCase().includes(q);
        return matchesName || matchesType || matchesCategory;
      }
      return true;
    });
  }, [platformKeys, activeCategoryFilter, searchQuery]);

  const activeConfig = PLATFORM_REGISTRY[selectedPlatform] || PLATFORM_REGISTRY.custom;

  return (
    <div className="w-full flex flex-col min-h-[400px]">
      {/* Hidden file input for custom logo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleCustomImageUpload}
        className="hidden"
      />

      {/* Portal Header */}
      <div className="px-4 py-3.5 bg-[#f7f9f9]/80 border-b border-[#eff3f4] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#1d9bf0]/10 text-[#1d9bf0] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-[#0f1419] text-sm sm:text-base leading-tight truncate">
              Link Portal
            </h3>
            <p className="text-xs text-[#536471] truncate">
              Official accounts & social hubs by @{user.username}
            </p>
          </div>
        </div>

        {isSelf && (
          <button
            type="button"
            onClick={openAddModal}
            className="text-xs font-bold text-white bg-[#1d9bf0] hover:bg-[#1a8cd8] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        )}
      </div>

      {/* Vertical Linktree-Style Card Stack */}
      <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-3">
        {links.length > 0 ? (
          links.map((link, idx) => {
            const platformType = (link.category as PlatformType) || detectPlatform(link.url, link.title);
            const config = PLATFORM_REGISTRY[platformType] || PLATFORM_REGISTRY.custom;
            const actionText = link.actionLabel || config.defaultActionLabel;

            return (
              <div
                key={link.id}
                className={`group relative bg-white border ${config.borderColor} ${config.hoverBorder} ${config.hoverBg} rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3`}
              >
                {/* Outbound Link Anchor */}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 flex-1 min-w-0"
                >
                  {/* Platform Rounded Icon Badge or Custom Uploaded Image */}
                  <div className={`w-11 h-11 rounded-xl ${config.iconBg} ${config.iconText} flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform duration-150`}>
                    {link.customIcon ? (
                      <img 
                        src={link.customIcon} 
                        alt={link.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      config.renderIcon("w-5 h-5")
                    )}
                  </div>

                  {/* Title & Secondary Details */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-[#0f1419] text-sm sm:text-[15px] leading-snug truncate group-hover:text-[#1d9bf0] transition-colors">
                        {link.title}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 hidden sm:inline-flex ${config.badgeBg} ${config.badgeText}`}>
                        {link.customIcon ? 'Custom' : config.name}
                      </span>
                    </div>
                    {link.subtitle ? (
                      <p className="text-xs text-[#536471] truncate mt-0.5">
                        {link.subtitle}
                      </p>
                    ) : (
                      <p className="text-xs text-[#536471] truncate mt-0.5">
                        {link.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </p>
                    )}
                  </div>

                  {/* Action Pill on the right */}
                  <div className="hidden xs:flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border border-current/20 transition-all group-hover:translate-x-0.5 ${config.badgeBg} ${config.badgeText}`}>
                      {actionText}
                    </span>
                  </div>
                </a>

                {/* Owner Actions (Edit, Reorder, Delete) */}
                {isSelf && (
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 pl-2 border-l border-[#eff3f4]">
                    <button
                      type="button"
                      onClick={() => openEditModal(link)}
                      title="Edit link & logo"
                      className="p-1 text-[#536471] hover:text-[#1d9bf0] hover:bg-blue-50 rounded cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveLink(idx, 'up')}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1 text-[#536471] hover:text-[#0f1419] hover:bg-gray-100 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveLink(idx, 'down')}
                      disabled={idx === links.length - 1}
                      title="Move down"
                      className="p-1 text-[#536471] hover:text-[#0f1419] hover:bg-gray-100 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link.id)}
                      title="Delete link"
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-4 border border-dashed border-gray-200 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-[#536471] flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-[#0f1419] text-base mb-1">
              No Links Added Yet
            </h4>
            <p className="text-xs text-[#536471] max-w-xs mx-auto mb-4">
              Add your Discord server, Twitch channel, X account, YouTube, or gaming profiles here.
            </p>
            {isSelf && (
              <button
                type="button"
                onClick={openAddModal}
                className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-xs px-4 py-2 rounded-full transition-colors cursor-pointer"
              >
                Add Your First Link
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2-STEP ADD / EDIT LINK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#eff3f4] overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff3f4] shrink-0">
              <div className="flex items-center gap-2.5">
                {modalStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="p-1 hover:bg-[#eff3f4] text-[#0f1419] rounded-full transition-colors cursor-pointer mr-1"
                    title="Back to logo selection"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="font-extrabold text-base text-[#0f1419]">
                    {modalStep === 1 
                      ? '1. Select Platform or Custom Logo' 
                      : editingLinkId ? '2. Edit Link Details' : '2. Fill In Link Details'}
                  </h3>
                  {modalStep === 1 && (
                    <p className="text-xs text-[#536471]">
                      Choose from {platformKeys.length}+ platforms or upload your own icon
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#536471] hover:text-[#0f1419] hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: SUPER DENSE & SEARCHABLE PLATFORM GRID */}
            {modalStep === 1 && (
              <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3.5">
                {/* Search Bar + Featured Custom Image Trigger */}
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#536471] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={`Search ${platformKeys.length}+ platforms (e.g. Kick, Steam, Discord, Insta)...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-[#f7f9f9] border border-gray-200 rounded-xl focus:bg-white focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="p-1 text-gray-400 hover:text-gray-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Custom Logo Trigger Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-[#1d9bf0] text-[#1d9bf0] rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Custom Image</span>
                  </button>
                </div>

                {/* Category Filter Horizontal Scrollbar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  {[
                    { id: 'all', label: `All (${platformKeys.length})` },
                    { id: 'gaming', label: '🎮 Gaming' },
                    { id: 'video', label: '📺 Streaming' },
                    { id: 'social', label: '💬 Social' },
                    { id: 'music', label: '🎵 Music' },
                    { id: 'art', label: '🎨 Art' },
                    { id: 'support', label: '💖 Support' },
                    { id: 'dev', label: '💻 Dev' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer text-[11px] sm:text-xs ${
                        activeCategoryFilter === cat.id
                          ? 'bg-[#0f1419] text-white shadow-2xs'
                          : 'bg-[#eff3f4] text-[#536471] hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* DENSE 5-6 COLUMN PLATFORM GRID */}
                {filteredPlatforms.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-2.5">
                    {filteredPlatforms.map((pKey) => {
                      const cfg = PLATFORM_REGISTRY[pKey];
                      const isSelected = selectedPlatform === pKey && !customLogoUrl;
                      return (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() => {
                            setCustomLogoUrl(null);
                            handleSelectPlatform(pKey);
                          }}
                          className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer group shadow-2xs hover:shadow-xs hover:scale-[1.03] ${
                            isSelected
                              ? 'border-[#1d9bf0] bg-blue-50/70 text-[#1d9bf0] ring-1 ring-[#1d9bf0]'
                              : 'border-[#eff3f4] bg-white hover:border-[#1d9bf0]/60 hover:bg-[#f7f9f9] text-[#0f1419]'
                          }`}
                          title={cfg.name}
                        >
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${cfg.iconBg} ${cfg.iconText} flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 transition-transform`}>
                            {cfg.renderIcon("w-4 h-4 sm:w-5 sm:h-5")}
                          </div>
                          <span className="text-[11px] font-bold text-[#0f1419] group-hover:text-[#1d9bf0] transition-colors truncate max-w-full leading-tight">
                            {cfg.name.split(' (')[0].split(' /')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl">
                    <p className="text-sm font-bold text-[#0f1419] mb-1">
                      No matching platform found for &quot;{searchQuery}&quot;
                    </p>
                    <p className="text-xs text-[#536471] mb-3">
                      You can use a custom image logo or select the generic website option.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectPlatform('custom')}
                      className="text-xs font-bold bg-[#1d9bf0] text-white px-4 py-2 rounded-full cursor-pointer hover:bg-[#1a8cd8]"
                    >
                      Use Custom Website Link
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: CONFIGURE DETAILS & LOGO SLOT REPLACEMENT */}
            {modalStep === 2 && (
              <form onSubmit={handleSaveLink} className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
                {/* Active Logo Assignment Slot Viewport */}
                <div className="p-3.5 bg-[#f7f9f9] border border-[#eff3f4] rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* The Active Logo Slot */}
                    <div className={`w-12 h-12 rounded-xl ${activeConfig.iconBg} ${activeConfig.iconText} flex items-center justify-center overflow-hidden shadow-2xs shrink-0 ring-2 ring-white`}>
                      {customLogoUrl ? (
                        <img 
                          src={customLogoUrl} 
                          alt="Custom logo preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        activeConfig.renderIcon("w-6 h-6")
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-extrabold text-[#0f1419] truncate">
                          {customLogoUrl ? 'Custom Photo Assigned' : activeConfig.name}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${activeConfig.badgeBg} ${activeConfig.badgeText}`}>
                          Active Logo
                        </span>
                      </div>
                      <p className="text-[11px] text-[#536471] truncate mt-0.5">
                        {customLogoUrl ? 'Custom image preview active' : 'Platform vector icon active'}
                      </p>
                    </div>
                  </div>

                  {/* Logo Slot Quick Switchers */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#1d9bf0] hover:bg-blue-100/60 bg-blue-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                      title="Upload or replace with custom photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{customLogoUrl ? 'Change image' : 'Custom photo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="text-xs font-bold text-[#536471] hover:bg-gray-200/70 bg-white border border-[#cfd9de] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      Pick logo
                    </button>
                  </div>
                </div>

                {/* Destination URL */}
                <div>
                  <label className="text-xs font-bold text-[#536471] uppercase tracking-wider block mb-1">
                    Destination URL *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={activeConfig.defaultPlaceholderUrl}
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-xl focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] outline-none"
                  />
                </div>

                {/* Card Headline / Title */}
                <div>
                  <label className="text-xs font-bold text-[#536471] uppercase tracking-wider block mb-1">
                    Card Title / Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Community Discord Server"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-xl focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] outline-none"
                  />
                </div>

                {/* Subtitle / Description */}
                <div>
                  <label className="text-xs font-bold text-[#536471] uppercase tracking-wider block mb-1">
                    Subtitle / Handle (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chat with mutuals, hang out & share artwork"
                    value={linkSubtitle}
                    onChange={(e) => setLinkSubtitle(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-xl focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] outline-none"
                  />
                </div>

                {/* Action Button Pill Label */}
                <div>
                  <label className="text-xs font-bold text-[#536471] uppercase tracking-wider block mb-1">
                    Action Pill Label
                  </label>
                  <input
                    type="text"
                    placeholder={activeConfig.defaultActionLabel}
                    value={linkActionLabel}
                    onChange={(e) => setLinkActionLabel(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-gray-300 rounded-xl focus:border-[#1d9bf0] focus:ring-1 focus:ring-[#1d9bf0] outline-none"
                  />
                  <span className="text-[11px] text-[#536471] mt-1 block">
                    Text displayed in the clickable pill on the right (e.g. &quot;{activeConfig.defaultActionLabel}&quot;)
                  </span>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#eff3f4] mt-2">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="text-xs font-bold text-[#536471] hover:text-[#0f1419] cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Logos</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-[#536471] hover:text-[#0f1419] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!linkUrl.trim()}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 rounded-full cursor-pointer transition-colors shadow-2xs"
                    >
                      {editingLinkId ? 'Update Link' : 'Save Link'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
