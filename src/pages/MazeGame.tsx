import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Trophy, Settings, X, Maximize, Minimize, Zap, Route, Shuffle, Ghost, ShoppingBag, Dices, Radar, Expand, Play, Waypoints, Footprints, Flame, RefreshCcw, Snowflake, Eye, Bomb, Compass, Palette, Scaling, Binary, Skull, Clock, ArrowDownUp, Music, Map, History, Infinity, Shirt, Hash, Wind, Activity, Scan, ArrowUpCircle, FastForward, Cpu, Sun, MoveUpRight, Tally1, Search, EyeOff, Box, Lightbulb, Waves, CloudRain, Grid, Contrast, Cloud, RotateCw, Rocket, Aperture, Radiation, PartyPopper, UserMinus, Cat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// --- Types ---
type CellType = "wall" | "path" | "start" | "exit";

interface Position {
  x: number;
  y: number;
}

// --- Constants ---
const INITIAL_VIEWPORT_SIZE = 13; // Number of cells visible in each dimension
const INITIAL_MAZE_SIZE = 11; // Must be odd
const DUCK_COLORS = [
  { name: "Classic", value: "#FFD700" },
  { name: "Cyan", value: "#00FFFF" },
  { name: "Magenta", value: "#FF00FF" },
  { name: "Lime", value: "#00FF00" },
  { name: "Orange", value: "#FF8C00" },
  { name: "White", value: "#FFFFFF" },
  { name: "Ruby", value: "#E11D48" },
  { name: "Purple", value: "#A855F7" },
];

const ACCESSORY_COLORS: Record<string, Record<string, Record<number, string>>> = {
  dress: {
    pink: { 4: "#FF69B4", 5: "#FFC0CB" },
    blue: { 4: "#3B82F6", 5: "#60A5FA" },
    red: { 4: "#EF4444", 5: "#F87171" },
    green: { 4: "#22C55E", 5: "#4ADE80" },
    yellow: { 4: "#EAB308", 5: "#FACC15" },
    purple: { 4: "#A855F7", 5: "#C084FC" },
    black: { 4: "#1F2937", 5: "#374151" },
    white: { 4: "#F3F4F6", 5: "#FFFFFF" },
    tuxedo: { 4: "#000000", 5: "#FFFFFF" },
    raincoat: { 4: "#FDE047", 5: "#EAB308" },
    superhero: { 4: "#DC2626", 5: "#2563EB" },
    ninja: { 4: "#111827", 5: "#374151" },
  }
};

const BEAK_COLOR = "#FF8C00";
const EYE_COLOR = "#000000";

// --- Accessories Pixel Art (8x8) ---
// 4: Accessory Primary, 5: Accessory Secondary
const ACCESSORIES: Record<string, Record<string, number[][] | null>> = {
  hat: {
    none: null,
    cap: [
      [0, 0, 0, 4, 4, 4, 0, 0],
      [0, 0, 4, 4, 4, 4, 4, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    crown: [
      [0, 4, 0, 4, 0, 4, 0, 0],
      [0, 4, 4, 4, 4, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    wizard: [
      [0, 0, 0, 4, 0, 0, 0, 0],
      [0, 0, 4, 4, 4, 0, 0, 0],
      [0, 4, 4, 4, 4, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  dress: {
    none: null,
    pink: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,5,5,5,5,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    blue: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,5,5,5,5,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    red: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,5,5,5,5,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    green: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,5,5,5,5,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    yellow: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,5,5,5,5,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    purple: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,5,5,5,5,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    black: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,5,5,5,5,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    white: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,5,5,5,5,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    tuxedo: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,4,4,0,0,0],[0,0,4,5,5,4,0,0],[0,4,5,5,5,5,4,0],[0,4,4,5,5,4,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    raincoat: [[0,0,0,4,4,4,0,0],[0,0,4,4,4,4,4,0],[0,0,4,4,4,4,4,0],[0,0,4,4,4,4,0,0],[0,4,4,4,4,4,4,0],[0,4,4,4,4,4,4,0],[4,4,4,4,4,4,4,4],[0,0,0,0,0,0,0,0]],
    superhero: [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[5,4,4,5,5,4,4,5],[5,4,4,5,5,4,4,5],[5,4,4,4,4,4,4,5],[0,0,0,0,0,0,0,0]],
    ninja: [[0,0,0,0,0,0,0,0],[0,0,4,4,4,4,0,0],[0,4,4,5,5,4,4,0],[0,4,4,4,4,4,4,0],[0,4,4,4,4,4,4,0],[0,4,4,4,4,4,4,0],[0,4,4,4,4,4,4,0],[0,0,0,0,0,0,0,0]],
  },
  shoes: {
    none: null,
    sneakers: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 4, 0, 0, 0, 4, 4, 0],
      [5, 5, 0, 0, 0, 5, 5, 0],
    ],
    boots: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [4, 4, 0, 0, 0, 4, 4, 0],
      [4, 4, 0, 0, 0, 4, 4, 0],
      [5, 5, 0, 0, 0, 5, 5, 0],
    ],
  },
  jacket: {
    none: null,
    vest: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 4, 4, 4, 0, 0],
      [0, 4, 4, 4, 4, 4, 4, 0],
      [0, 4, 4, 4, 4, 4, 4, 0],
      [0, 0, 4, 4, 4, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    suit: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 4, 4, 4, 4, 0, 0],
      [0, 4, 5, 4, 4, 5, 4, 0],
      [0, 4, 4, 4, 4, 4, 4, 0],
      [0, 4, 4, 4, 4, 4, 4, 0],
      [0, 0, 4, 4, 4, 4, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  weapon: {
    none: null,
    sword: [
      [0, 0, 0, 0, 0, 0, 0, 5],
      [0, 0, 0, 0, 0, 0, 5, 0],
      [0, 0, 0, 0, 0, 5, 0, 0],
      [0, 0, 0, 0, 5, 0, 0, 0],
      [0, 0, 0, 5, 0, 0, 0, 0],
      [0, 0, 4, 0, 0, 0, 0, 0],
      [0, 4, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    staff: [
      [0, 0, 0, 0, 0, 0, 0, 5],
      [0, 0, 0, 0, 0, 0, 4, 0],
      [0, 0, 0, 0, 0, 4, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0],
      [0, 0, 0, 4, 0, 0, 0, 0],
      [0, 0, 4, 0, 0, 0, 0, 0],
      [0, 4, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
};

// --- Duck Pixel Art (8x8) ---
// 1: Duck Color, 2: Beak Color, 3: Eye Color
const DUCK_PIXELS = {
  right: [
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 3, 1, 2, 2],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  left: [
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [2, 2, 1, 3, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  up: [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  down: [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 3, 1, 1, 3, 1, 0],
    [0, 1, 1, 2, 2, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

const MOD_LIST = [
  { id: "superSpeed", icon: Zap, title: "SUPER SPEED", description: "Duck runs faster and overshoots until hitting a wall.", pros: "FASTER MOVEMENT", cons: "CANNOT STOP AT JUNCTIONS" },
  { id: "pathFinder", icon: Route, title: "PATH FINDER", description: "Show the optimal path to the exit.", pros: "GUARANTEED ROUTE", cons: "REMOVES CHALLENGE" },
  { id: "randomExit", icon: Shuffle, title: "RANDOM EXIT", description: "Exit spawns at a random path location.", pros: "UNPREDICTABLE", cons: "MIGHT BE TOO CLOSE" },
  { id: "ghostDuck", icon: Ghost, title: "GHOST DUCK", description: "Phase through walls to reach adjacent paths.", pros: "WALL SHORTCUTS", cons: "MUST REACH A PATH" },
  { id: "visionPulse", icon: Radar, title: "VISION PULSE", description: "The maze is dark, revealed only by periodic pulses.", pros: "STIMULATING", cons: "HARD TO NAVIGATE" },
  { id: "eagleEye", icon: Expand, title: "EAGLE EYE", description: "Zoom out to see a larger portion of the maze.", pros: "PLAN LONG ROUTES", cons: "HARD TO SEE DETAILS" },
  { id: "autoPilot", icon: Play, title: "AUTO-PILOT", description: "The duck automatically moves toward the exit.", pros: "EFFORTLESS", cons: "NO CHALLENGE" },
  { id: "warpPortals", icon: Waypoints, title: "WARP PORTALS", description: "Randomly spawns interconnected teleportation portals.", pros: "SKIP SECTIONS", cons: "RANDOM PLACEMENT" },
  { id: "trailBlazer", icon: Footprints, title: "TRAIL BLAZER", description: "Leave a permanent glowing trail on visited cells.", pros: "TRACK VISITED PATHS", cons: "VISUAL CLUTTER" },
  { id: "wallBreaker", icon: Flame, title: "WALL BREAKER", description: "Fire a beam to break walls in front of you.", pros: "CREATE SHORTCUTS", cons: "BYPASS LOGIC" },
  { id: "mirrorMode", icon: RefreshCcw, title: "MIRROR MODE", description: "Directional controls are completely reversed.", pros: "MENTAL CHALLENGE", cons: "VERY CONFUSING" },
  { id: "slipperyIce", icon: Snowflake, title: "SLIPPERY ICE", description: "The floor is ice! You slide 1 cell after moving.", pros: "FASTER TRAVERSAL", cons: "HARDER TO STOP" },
  { id: "nightVision", icon: Eye, title: "NIGHT VISION", description: "See clearly even in the dark (wider vision range).", pros: "EASY NAVIGATION", cons: "LESS MYSTERY" },
  { id: "sonicBoom", icon: Bomb, title: "SONIC BOOM", description: "Release a blast that destroys all surrounding walls.", pros: "CLEAR MASSIVE PATHS", cons: "MANUAL TRIGGER" },
  { id: "compass", icon: Compass, title: "COMPASS", description: "An arrow always points towards the exit.", pros: "NEVER GET LOST", cons: "MAKES IT TRIVIAL" },
  { id: "rainbowDuck", icon: Palette, title: "RAINBOW DUCK", description: "Your duck cycles through a spectrum of colors.", pros: "AESTHETIC", cons: "NO ADVANTAGE" },
  { id: "sizeShifter", icon: Scaling, title: "SIZE SHIFTER", description: "The world pulsates, changing your view size.", pros: "DYNAMIC GAMEPLAY", cons: "DISORIENTING" },
  { id: "matrixMode", icon: Binary, title: "MATRIX MODE", description: "The maze is made of falling green code.", pros: "LOOK LIKE A PRO", cons: "HARDER TO SEE PATHS" },
  { id: "hardcoreMode", icon: Skull, title: "HARDCORE MODE", description: "Hitting a wall resets you to the start.", pros: "ULTIMATE CHALLENGE", cons: "PUNISHING" },
  { id: "timeWarp", icon: Clock, title: "TIME WARP", description: "Slow down time for more precise movement.", pros: "PRECISION", cons: "SLOWER PROGRESS" },
  { id: "gravityFlip", icon: ArrowDownUp, title: "GRAVITY FLIP", description: "The entire game is flipped upside down.", pros: "NEW PERSPECTIVE", cons: "INVERTED VISUALS" },
  { id: "discoMode", icon: Music, title: "DISCO MODE", description: "Flashy cycling colors for the whole maze.", pros: "PARTY ATMOSPHERE", cons: "EYE STRAIN" },
  { id: "minimap", icon: Map, title: "MINIMAP", description: "Shows a small overview of the entire maze.", pros: "LONG-DISTANCE PLAN", cons: "OCCUPIES SPACE" },
  { id: "ghostTrail", icon: History, title: "GHOST TRAIL", description: "Leave a fading trail of where you just were.", pros: "TRACK RECENT MOVES", cons: "DISTRACTING" },
  { id: "portalMaster", icon: Infinity, title: "PORTAL MASTER", description: "Generates 4 portals instead of 2.", pros: "COMPLEX SKIPS", cons: "UNPREDICTABLE" },
  { id: "blinkDash", icon: Wind, title: "BLINK DASH", description: "Teleport 2 cells forward, bypassing any walls.", pros: "INSTANT SHORTCUTS", cons: "MANUAL TRIGGER" },
  { id: "staticNoise", icon: Activity, title: "STATIC NOISE", description: "Adds flickering visual interference to the maze.", pros: "TEST CONCENTRATION", cons: "DISORIENTING" },
  { id: "xRayVision", icon: Scan, title: "X-RAY VISION", description: "The exit location is always visible through walls.", pros: "KNOW WHERE TO GO", cons: "LESS EXPLORATION" },
  { id: "doubleJump", icon: ArrowUpCircle, title: "DOUBLE JUMP", description: "Move 2 cells at once when the path is clear.", pros: "VASTLY INCREASE SPEED", cons: "HARDER CONTROL" },
  { id: "speedDemon", icon: FastForward, title: "SPEED DEMON", description: "Movement speed scales up the longer you move.", pros: "INCREDIBLE TOP SPEED", cons: "HARD TO REACT" },
  { id: "glitchDuck", icon: Cpu, title: "GLITCH DUCK", description: "Duck flickers in and out of reality.", pros: "LOOKS COOL", cons: "HARD TO TRACK" },
  { id: "neonPath", icon: Sun, title: "NEON PATH", description: "Paths glow with vibrant neon colors.", pros: "VIBRANT VISUALS", cons: "COLOR OVERLOAD" },
  { id: "bouncyWalls", icon: MoveUpRight, title: "BOUNCY WALLS", description: "Hitting a wall bounces you back with force.", pros: "AVOID WALL STICKING", cons: "UNEXPECTED MOVES" },
  { id: "lowFriction", icon: Tally1, title: "LOW FRICTION", description: "Harder to stop; you slide slightly after moving.", pros: "MOMENTUM", cons: "PRECISE STOPS HARD" },
  { id: "magnifier", icon: Search, title: "MAGNIFIER", description: "The area around the duck is permanently zoomed.", pros: "SEE DETAILS", cons: "REDUCED VIEW" },
  { id: "camouflage", icon: EyeOff, title: "CAMOUFLAGE", description: "Duck changes color to blend with the environment.", pros: "STEALTHY", cons: "HARD TO SEE SELF" },
  { id: "ghostlyWalls", icon: Box, title: "GHOSTLY WALLS", description: "Walls are semi-transparent, revealing structure.", pros: "SEE THROUGH WALLS", cons: "CONFUSING DEPTH" },
  { id: "strobe", icon: Lightbulb, title: "STROBE LIGHT", description: "The screen flashes with intense light.", pros: "INTENSE FEEL", cons: "EYE FATIGUE" },
  { id: "earthquake", icon: Waves, title: "EARTHQUAKE", description: "The entire maze shakes whenever you move.", pros: "IMMERSIVE", cons: "DISORIENTING" },
  { id: "windGusts", icon: CloudRain, title: "WIND GUSTS", description: "Periodic wind gusts push the duck randomly.", pros: "DYNAMIC ENVIRONMENT", cons: "UNWANTED PUSHES" },
  { id: "pixelate", icon: Grid, title: "RETRO PIXELATE", description: "Apply a retro pixelation filter to the game.", pros: "RETRO VIBES", cons: "LESS CLARITY" },
  { id: "invertVisuals", icon: Contrast, title: "INVERT COLORS", description: "All colors in the game are completely inverted.", pros: "UNIQUE LOOK", cons: "VISUALLY JARRING" },
  { id: "fogOfWar", icon: Cloud, title: "FOG OF WAR", description: "Only the immediate vicinity is visible.", pros: "HIGH SUSPENSE", cons: "VERY DIFFICULT" },
  { id: "drunkenMaster", icon: RotateCw, title: "DRUNKEN MASTER", description: "Directional controls swap every 10 seconds.", pros: "UNPREDICTABLE", cons: "EXTREMELY HARD" },
  { id: "jetpack", icon: Rocket, title: "JETPACK", description: "Ability to jump over single walls.", pros: "WALL JUMPING", cons: "COOLDOWN REQUIRED" },
  { id: "laserVision", icon: Aperture, title: "LASER VISION", description: "Break multiple walls in a straight line.", pros: "LONG RANGE BREAK", cons: "MANUAL TRIGGER" },
  { id: "nuclearBlast", icon: Radiation, title: "NUCLEAR BLAST", description: "Clear a large circular area of walls.", pros: "ULTIMATE CLEARANCE", cons: "DESTRUCTIVE" },
  { id: "confettiTrail", icon: PartyPopper, title: "CONFETTI TRAIL", description: "Leave a trail of colorful confetti.", pros: "CELEBRATORY", cons: "VISUAL NOISE" },
  { id: "thiefExit", icon: UserMinus, title: "THIEF EXIT", description: "The exit moves if you get too close to it.", pros: "EXTRA CHALLENGE", cons: "FRUSTRATING" },
  { id: "hauntedMaze", icon: Cat, title: "HAUNTED MAZE", description: "Ghostly apparitions haunt the maze corridors.", pros: "SPOOKY ATMOSPHERE", cons: "SCARY" },
];

const DuckLivePreview = ({ customization }: { customization: any }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setFrame(f => (f + 1) % 252); // 63 frames * 4 directions
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const directions: ("down" | "left" | "up" | "right")[] = ["down", "right", "up", "left"];
    const dir = directions[Math.floor(frame / 63)];
    const wobble = Math.round(Math.sin(frame * 0.3) * 3);
    const pixelSize = canvas.width / 8;
    const duckPixels = DUCK_PIXELS[dir];

    const drawPixels = (pixels: number[][], colors: Record<number, string>) => {
      pixels.forEach((row, rowIdx) => {
        row.forEach((pixel, colIdx) => {
          if (pixel === 0 || !colors[pixel]) return;
          ctx.fillStyle = colors[pixel];
          const x = Math.floor(colIdx * pixelSize);
          const y = Math.floor(rowIdx * pixelSize + wobble + 4); // +4 to center vertically
          const w = Math.ceil(pixelSize);
          const h = Math.ceil(pixelSize);
          ctx.fillRect(x, y, w, h);
        });
      });
    };

    // Draw Duck
    drawPixels(duckPixels, {
      1: customization.color,
      2: BEAK_COLOR,
      3: EYE_COLOR
    });

    // Draw Accessories
    Object.keys(ACCESSORIES).forEach(type => {
      const accessoryName = customization[type as keyof typeof customization];
      const accessoryPixels = ACCESSORIES[type]?.[accessoryName as string];
      if (accessoryPixels) {
        const customColors = ACCESSORY_COLORS[type]?.[accessoryName as string];
        drawPixels(accessoryPixels, customColors || {
          4: "#fff",
          5: "#555"
        });
      }
    });
  }, [frame, customization]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-white/10 rounded-2xl gap-2">
      <canvas ref={canvasRef} width={80} height={80} className="pixelated" />
      <span className="text-[10px] text-primary font-bold animate-pulse">LIVE_PREVIEW</span>
    </div>
  );
};

const MazeGame = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- State ---
  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem("maze_level");
    return saved ? parseInt(saved, 10) : 1;
  });
  const [maze, setMaze] = useState<CellType[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [direction, setDirection] = useState<"up" | "down" | "left" | "right">("down");
  const [isMoving, setIsMoving] = useState(false);
  const [frame, setFrame] = useState(0);
  const [pulseCycle, setPulseCycle] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModStore, setShowModStore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditDuck, setShowEditDuck] = useState(false);
  const [showLevelJump, setShowLevelJump] = useState(false);
  const [mods, setMods] = useState({
    superSpeed: localStorage.getItem("maze_mod_speed") === "true",
    ghostDuck: localStorage.getItem("maze_mod_ghost") === "true",
    pathFinder: localStorage.getItem("maze_mod_path") === "true",
    randomExit: localStorage.getItem("maze_random_exit") === "true",
    visionPulse: localStorage.getItem("maze_mod_vision") === "true",
    eagleEye: localStorage.getItem("maze_mod_eagle") === "true",
    autoPilot: localStorage.getItem("maze_mod_auto") === "true",
    warpPortals: localStorage.getItem("maze_mod_warp") === "true",
    trailBlazer: localStorage.getItem("maze_mod_trail") === "true",
    wallBreaker: localStorage.getItem("maze_mod_breaker") === "true",
    mirrorMode: localStorage.getItem("maze_mod_mirror") === "true",
    slipperyIce: localStorage.getItem("maze_mod_ice") === "true",
    nightVision: localStorage.getItem("maze_mod_night") === "true",
    sonicBoom: localStorage.getItem("maze_mod_sonic") === "true",
    compass: localStorage.getItem("maze_mod_compass") === "true",
    rainbowDuck: localStorage.getItem("maze_mod_rainbow") === "true",
    sizeShifter: localStorage.getItem("maze_mod_size") === "true",
    matrixMode: localStorage.getItem("maze_mod_matrix") === "true",
    hardcoreMode: localStorage.getItem("maze_mod_hardcore") === "true",
    timeWarp: localStorage.getItem("maze_mod_timewarp") === "true",
    gravityFlip: localStorage.getItem("maze_mod_gravity") === "true",
    discoMode: localStorage.getItem("maze_mod_disco") === "true",
    minimap: localStorage.getItem("maze_mod_minimap") === "true",
    ghostTrail: localStorage.getItem("maze_mod_ghosttrail") === "true",
    portalMaster: localStorage.getItem("maze_mod_portalmaster") === "true",
    blinkDash: localStorage.getItem("maze_mod_blink") === "true",
    staticNoise: localStorage.getItem("maze_mod_static") === "true",
    xRayVision: localStorage.getItem("maze_mod_xray") === "true",
    doubleJump: localStorage.getItem("maze_mod_doublejump") === "true",
    speedDemon: localStorage.getItem("maze_mod_speeddemon") === "true",
    glitchDuck: localStorage.getItem("maze_mod_glitch") === "true",
    neonPath: localStorage.getItem("maze_mod_neon") === "true",
    bouncyWalls: localStorage.getItem("maze_mod_bouncy") === "true",
    lowFriction: localStorage.getItem("maze_mod_friction") === "true",
    magnifier: localStorage.getItem("maze_mod_magnifier") === "true",
    camouflage: localStorage.getItem("maze_mod_camouflage") === "true",
    ghostlyWalls: localStorage.getItem("maze_mod_ghostly") === "true",
    strobe: localStorage.getItem("maze_mod_strobe") === "true",
    earthquake: localStorage.getItem("maze_mod_earthquake") === "true",
    windGusts: localStorage.getItem("maze_mod_windgusts") === "true",
    pixelate: localStorage.getItem("maze_mod_pixelate") === "true",
    invertVisuals: localStorage.getItem("maze_mod_invert") === "true",
    fogOfWar: localStorage.getItem("maze_mod_fog") === "true",
    drunkenMaster: localStorage.getItem("maze_mod_drunken") === "true",
    jetpack: localStorage.getItem("maze_mod_jetpack") === "true",
    laserVision: localStorage.getItem("maze_mod_laser") === "true",
    nuclearBlast: localStorage.getItem("maze_mod_nuclear") === "true",
    confettiTrail: localStorage.getItem("maze_mod_confetti") === "true",
    thiefExit: localStorage.getItem("maze_mod_thief") === "true",
    hauntedMaze: localStorage.getItem("maze_mod_haunted") === "true",
  });

  const [customization, setCustomization] = useState(() => {
    const saved = localStorage.getItem("maze_customization");
    return saved ? JSON.parse(saved) : {
      color: "#FFD700",
      hat: "none",
      shoes: "none",
      jacket: "none",
      dress: "none",
      weapon: "none"
    };
  });

  const [lastPos, setLastPos] = useState<Position[]>([]);
  const [continuousMoveCount, setContinuousMoveCount] = useState(0);
  const [exitPos, setExitPos] = useState<Position>({ x: 0, y: 0 });
  const [portals, setPortals] = useState<Position[]>([]);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());
  const [solutionPath, setSolutionPath] = useState<Position[]>([]);
  const [jumpLevel, setJumpLevel] = useState("");
  const [controlMap, setControlMap] = useState<Record<string, "up" | "down" | "left" | "right">>({
    up: "up", down: "down", left: "left", right: "right"
  });
  const moveIntervalRef = useRef<any>(null);

  // --- Maze Generation (Recursive Backtracking) ---
  const generateMaze = useCallback((lvl: number, isRandomExit: boolean) => {
    const size = INITIAL_MAZE_SIZE + (lvl - 1) * 2;
    const newMaze: CellType[][] = Array(size).fill(null).map(() => Array(size).fill("wall"));

    const stack: Position[] = [];
    const start: Position = { x: 1, y: 1 };
    newMaze[start.y][start.x] = "path";
    stack.push(start);

    const getNeighbors = (p: Position) => {
      const neighbors: { pos: Position; wall: Position }[] = [];
      const dirs = [
        { dx: 0, dy: -2, wx: 0, wy: -1 },
        { dx: 0, dy: 2, wx: 0, wy: 1 },
        { dx: -2, dy: 0, wx: -1, wy: 0 },
        { dx: 2, dy: 0, wx: 1, wy: 0 },
      ];

      for (const d of dirs) {
        const nx = p.x + d.dx;
        const ny = p.y + d.dy;
        if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && newMaze[ny][nx] === "wall") {
          neighbors.push({ pos: { x: nx, y: ny }, wall: { x: p.x + d.wx, y: p.y + d.wy } });
        }
      }
      return neighbors;
    };

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = getNeighbors(current);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        newMaze[next.wall.y][next.wall.x] = "path";
        newMaze[next.pos.y][next.pos.x] = "path";
        stack.push(next.pos);
      } else {
        stack.pop();
      }
    }

    // Set Exit
    let finalExitPos: Position;
    if (isRandomExit) {
      const paths: Position[] = [];
      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          if (newMaze[y][x] === "path" && (x > size / 2 || y > size / 2)) {
            paths.push({ x, y });
          }
        }
      }
      finalExitPos = paths[Math.floor(Math.random() * paths.length)];
      newMaze[finalExitPos.y][finalExitPos.x] = "exit";
    } else {
      finalExitPos = { x: size - 2, y: size - 2 };
      newMaze[finalExitPos.y][finalExitPos.x] = "exit";
    }

    // Set Portals
    const paths: Position[] = [];
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        if (newMaze[y][x] === "path" && !(x === 1 && y === 1) && !(x === finalExitPos.x && y === finalExitPos.y)) {
          paths.push({ x, y });
        }
      }
    }
    const portalCount = mods.portalMaster ? 4 : 2;
    if (paths.length >= portalCount) {
      const newPortals: Position[] = [];
      for (let i = 0; i < portalCount; i++) {
        newPortals.push(paths.splice(Math.floor(Math.random() * paths.length), 1)[0]);
      }
      setPortals(newPortals);
    } else if (paths.length >= 2) {
      const p1 = paths.splice(Math.floor(Math.random() * paths.length), 1)[0];
      const p2 = paths.splice(Math.floor(Math.random() * paths.length), 1)[0];
      setPortals([p1, p2]);
    } else {
      setPortals([]);
    }

    setMaze(newMaze);
    setExitPos(finalExitPos);
    setPlayerPos({ x: 1, y: 1 });
    setVisitedCells(new Set(["1,1"]));
    setGameWon(false);
  }, []);

  const randomizePosition = useCallback(() => {
    if (maze.length === 0) return;
    const paths: Position[] = [];
    for (let y = 1; y < maze.length - 1; y++) {
      for (let x = 1; x < maze[0].length - 1; x++) {
        if (maze[y][x] === "path") {
          paths.push({ x, y });
        }
      }
    }
    if (paths.length > 0) {
      const newPos = paths[Math.floor(Math.random() * paths.length)];
      setPlayerPos(newPos);
    }
  }, [maze]);

  useEffect(() => {
    generateMaze(level, mods.randomExit);
  }, [level, mods.randomExit, generateMaze]);

  const findPath = useCallback((currentMaze: CellType[][], start: Position, end: Position) => {
    if (!currentMaze.length || !start || !end) return [];
    const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      if (pos.x === end.x && pos.y === end.y) return path;

      const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      ];

      for (const d of dirs) {
        const nx = pos.x + d.dx;
        const ny = pos.y + d.dy;
        if (
          nx >= 0 && nx < currentMaze[0].length &&
          ny >= 0 && ny < currentMaze.length &&
          currentMaze[ny][nx] !== "wall" &&
          !visited.has(`${nx},${ny}`)
        ) {
          visited.add(`${nx},${ny}`);
          queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
        }
      }
    }
    return [];
  }, []);

  // --- Movement ---
  const move = useCallback((requestedDir: "up" | "down" | "left" | "right") => {
    if (gameWon || maze.length === 0) return;

    let dir = mods.drunkenMaster ? controlMap[requestedDir] : requestedDir;
    if (mods.mirrorMode) {
      if (requestedDir === "up") dir = "down";
      else if (requestedDir === "down") dir = "up";
      else if (requestedDir === "left") dir = "right";
      else if (requestedDir === "right") dir = "left";
    }

    if (mods.gravityFlip) {
      if (dir === "up") dir = "down";
      else if (dir === "down") dir = "up";
      else if (dir === "left") dir = "right";
      else if (dir === "right") dir = "left";
    }

    setDirection(dir);
    setIsMoving(true);
    setContinuousMoveCount(c => c + 1);
    setTimeout(() => setIsMoving(false), 150);

    setPlayerPos(prev => {
      let currentPos = { ...prev };

      const getNext = (p: Position) => {
        const n = { ...p };
        if (dir === "up") n.y -= 1;
        if (dir === "down") n.y += 1;
        if (dir === "left") n.x -= 1;
        if (dir === "right") n.x += 1;
        return n;
      };

      const isWall = (p: Position) => {
        if (p.x < 0 || p.x >= maze[0].length || p.y < 0 || p.y >= maze.length) return true;
        return maze[p.y][p.x] === "wall";
      };

      const handlePortal = (p: Position) => {
        if (mods.warpPortals || mods.portalMaster) {
          const idx = portals.findIndex(port => port.x === p.x && port.y === p.y);
          if (idx !== -1) {
            // Teleport to next portal in sequence
            return portals[(idx + 1) % portals.length];
          }
        }
        return p;
      };

      if (mods.ghostDuck) {
        let nextPos = getNext(currentPos);
        if (isWall(nextPos)) {
          while (isWall(nextPos)) {
            nextPos = getNext(nextPos);
            if (nextPos.x < 0 || nextPos.x >= maze[0].length || nextPos.y < 0 || nextPos.y >= maze.length) {
              return prev;
            }
          }
        }
        if (maze[nextPos.y][nextPos.x] === "exit") {
          setGameWon(true);
          setTimeout(() => setLevel(l => l + 1), 1500);
        }
        const teleported = handlePortal(nextPos);
        return teleported;
      }

      if (mods.superSpeed) {
        let nextPos = getNext(currentPos);
        while (!isWall(nextPos)) {
          currentPos = nextPos;
          if (maze[currentPos.y][currentPos.x] === "exit") break;
          nextPos = getNext(currentPos);
        }
        if (currentPos.x === prev.x && currentPos.y === prev.y) return prev;

        if (maze[currentPos.y][currentPos.x] === "exit") {
          setGameWon(true);
          setTimeout(() => setLevel(l => l + 1), 1500);
        }
        return currentPos;
      }

      const nextPos = getNext(currentPos);

      if (isWall(nextPos)) {
        if (mods.bouncyWalls) {
           // Bouncing logic: move 1 cell in opposite direction if path is clear
           const oppositeDir = dir === "up" ? "down" : dir === "down" ? "up" : dir === "left" ? "right" : "left";
           const bouncePos = { ...currentPos };
           if (oppositeDir === "up") bouncePos.y -= 1;
           if (oppositeDir === "down") bouncePos.y += 1;
           if (oppositeDir === "left") bouncePos.x -= 1;
           if (oppositeDir === "right") bouncePos.x += 1;

           if (!isWall(bouncePos)) return bouncePos;
        }
        return prev;
      }

      if (!isWall(nextPos)) {
        let finalPos = nextPos;

        // Double Jump: Move 2 cells at once if path is clear
        if (mods.doubleJump) {
          const secondPos = getNext(nextPos);
          if (!isWall(secondPos)) {
            finalPos = secondPos;
          }
        }

        if (maze[finalPos.y][finalPos.x] === "exit") {
          setGameWon(true);
          setTimeout(() => setLevel(l => l + 1), 1500);
        }
        const teleported = handlePortal(finalPos);

        if (mods.thiefExit && exitPos) {
           const dist = Math.abs(teleported.x - exitPos.x) + Math.abs(teleported.y - exitPos.y);
           if (dist < 3) {
             // Move exit to a random path
             const paths: Position[] = [];
             for (let y = 1; y < maze.length - 1; y++) {
               for (let x = 1; x < maze[0].length - 1; x++) {
                 if (maze[y][x] === "path" && (Math.abs(x - teleported.x) + Math.abs(y - teleported.y) > 5)) {
                   paths.push({ x, y });
                 }
               }
             }
             if (paths.length > 0) {
               const newExit = paths[Math.floor(Math.random() * paths.length)];
               setMaze(prevMaze => {
                 const next = [...prevMaze.map(row => [...row])];
                 next[exitPos.y][exitPos.x] = "path";
                 next[newExit.y][newExit.x] = "exit";
                 return next;
               });
               setExitPos(newExit);
             }
           }
        }

        if (mods.ghostTrail) {
          setLastPos(lp => [prev, ...lp].slice(0, 5));
        }

        return teleported;
      } else {
        if (mods.hardcoreMode) {
          setPlayerPos({ x: 1, y: 1 });
          return { x: 1, y: 1 };
        }
      }
      return prev;
    });

    if (mods.slipperyIce || mods.lowFriction) {
      setTimeout(() => {
        setPlayerPos(prev => {
          const getNext = (p: Position) => {
            const n = { ...p };
            if (dir === "up") n.y -= 1;
            if (dir === "down") n.y += 1;
            if (dir === "left") n.x -= 1;
            if (dir === "right") n.x += 1;
            return n;
          };
          const isWall = (p: Position) => {
            if (p.x < 0 || p.x >= maze[0].length || p.y < 0 || p.y >= maze.length) return true;
            return maze[p.y][p.x] === "wall";
          };
          const next = getNext(prev);
          if (!isWall(next)) {
             if (mods.lowFriction && Math.random() > 0.5) return prev; // random skip for friction? No, friction means sliding.
             if (maze[next.y][next.x] === "exit") {
               setGameWon(true);
               setTimeout(() => setLevel(l => l + 1), 1500);
             }
             return next;
          }
          return prev;
        });
      }, 100);
    }
  }, [gameWon, maze, mods, portals]);

  useEffect(() => {
    if ((mods.pathFinder || mods.autoPilot) && maze.length > 0 && exitPos) {
      setSolutionPath(findPath(maze, playerPos, exitPos));
    } else {
      setSolutionPath([]);
    }
  }, [mods.pathFinder, mods.autoPilot, playerPos, maze, exitPos, findPath]);

  useEffect(() => {
    if (mods.autoPilot && !gameWon && solutionPath.length > 1) {
      const timer = setTimeout(() => {
        const nextCell = solutionPath[1];
        if (nextCell.x > playerPos.x) move("right");
        else if (nextCell.x < playerPos.x) move("left");
        else if (nextCell.y > playerPos.y) move("down");
        else if (nextCell.y < playerPos.y) move("up");
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mods.autoPilot, gameWon, solutionPath, playerPos.x, playerPos.y, move]);

  useEffect(() => {
    if (mods.drunkenMaster && !gameWon) {
      const interval = setInterval(() => {
        const dirs: ("up" | "down" | "left" | "right")[] = ["up", "down", "left", "right"];
        const shuffled = [...dirs].sort(() => Math.random() - 0.5);
        setControlMap({
          up: shuffled[0],
          down: shuffled[1],
          left: shuffled[2],
          right: shuffled[3],
        });
      }, 10000);
      return () => clearInterval(interval);
    } else {
      setControlMap({ up: "up", down: "down", left: "left", right: "right" });
    }
  }, [mods.drunkenMaster, gameWon]);

  useEffect(() => {
    if (mods.windGusts && !gameWon) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          const dirs: ("up" | "down" | "left" | "right")[] = ["up", "down", "left", "right"];
          const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
          move(randomDir);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [mods.windGusts, gameWon, move]);

  useEffect(() => {
    if (mods.trailBlazer) {
      setVisitedCells(v => {
        const key = `${playerPos.x},${playerPos.y}`;
        if (v.has(key)) return v;
        const next = new Set(v);
        next.add(key);
        return next;
      });
    }
  }, [playerPos.x, playerPos.y, mods.trailBlazer]);

  useEffect(() => {
    localStorage.setItem("maze_level", level.toString());
    localStorage.setItem("maze_random_exit", mods.randomExit.toString());
    localStorage.setItem("maze_mod_speed", mods.superSpeed.toString());
    localStorage.setItem("maze_mod_ghost", mods.ghostDuck.toString());
    localStorage.setItem("maze_mod_path", mods.pathFinder.toString());
    localStorage.setItem("maze_mod_vision", mods.visionPulse.toString());
    localStorage.setItem("maze_mod_eagle", mods.eagleEye.toString());
    localStorage.setItem("maze_mod_auto", mods.autoPilot.toString());
    localStorage.setItem("maze_mod_warp", mods.warpPortals.toString());
    localStorage.setItem("maze_mod_trail", mods.trailBlazer.toString());
    localStorage.setItem("maze_mod_breaker", mods.wallBreaker.toString());
    localStorage.setItem("maze_mod_mirror", mods.mirrorMode.toString());
    localStorage.setItem("maze_mod_ice", mods.slipperyIce.toString());
    localStorage.setItem("maze_mod_night", mods.nightVision.toString());
    localStorage.setItem("maze_mod_sonic", mods.sonicBoom.toString());
    localStorage.setItem("maze_mod_compass", mods.compass.toString());
    localStorage.setItem("maze_mod_rainbow", mods.rainbowDuck.toString());
    localStorage.setItem("maze_mod_size", mods.sizeShifter.toString());
    localStorage.setItem("maze_mod_matrix", mods.matrixMode.toString());
    localStorage.setItem("maze_mod_hardcore", mods.hardcoreMode.toString());
    localStorage.setItem("maze_mod_timewarp", mods.timeWarp.toString());
    localStorage.setItem("maze_mod_gravity", mods.gravityFlip.toString());
    localStorage.setItem("maze_mod_disco", mods.discoMode.toString());
    localStorage.setItem("maze_mod_minimap", mods.minimap.toString());
    localStorage.setItem("maze_mod_ghosttrail", mods.ghostTrail.toString());
    localStorage.setItem("maze_mod_portalmaster", mods.portalMaster.toString());
    localStorage.setItem("maze_mod_blink", mods.blinkDash.toString());
    localStorage.setItem("maze_mod_static", mods.staticNoise.toString());
    localStorage.setItem("maze_mod_xray", mods.xRayVision.toString());
    localStorage.setItem("maze_mod_doublejump", mods.doubleJump.toString());
    localStorage.setItem("maze_mod_speeddemon", mods.speedDemon.toString());
    localStorage.setItem("maze_mod_glitch", mods.glitchDuck.toString());
    localStorage.setItem("maze_mod_neon", mods.neonPath.toString());
    localStorage.setItem("maze_mod_bouncy", mods.bouncyWalls.toString());
    localStorage.setItem("maze_mod_friction", mods.lowFriction.toString());
    localStorage.setItem("maze_mod_magnifier", mods.magnifier.toString());
    localStorage.setItem("maze_mod_camouflage", mods.camouflage.toString());
    localStorage.setItem("maze_mod_ghostly", mods.ghostlyWalls.toString());
    localStorage.setItem("maze_mod_strobe", mods.strobe.toString());
    localStorage.setItem("maze_mod_earthquake", mods.earthquake.toString());
    localStorage.setItem("maze_mod_windgusts", mods.windGusts.toString());
    localStorage.setItem("maze_mod_pixelate", mods.pixelate.toString());
    localStorage.setItem("maze_mod_invert", mods.invertVisuals.toString());
    localStorage.setItem("maze_mod_fog", mods.fogOfWar.toString());
    localStorage.setItem("maze_mod_drunken", mods.drunkenMaster.toString());
    localStorage.setItem("maze_mod_jetpack", mods.jetpack.toString());
    localStorage.setItem("maze_mod_laser", mods.laserVision.toString());
    localStorage.setItem("maze_mod_nuclear", mods.nuclearBlast.toString());
    localStorage.setItem("maze_mod_confetti", mods.confettiTrail.toString());
    localStorage.setItem("maze_mod_thief", mods.thiefExit.toString());
    localStorage.setItem("maze_mod_haunted", mods.hauntedMaze.toString());
  }, [level, mods]);

  useEffect(() => {
    localStorage.setItem("maze_customization", JSON.stringify(customization));
  }, [customization]);

  // --- Animation Loop ---
  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setFrame(f => (f + 1) % 60);
      setPulseCycle(p => (p + 1) % 180); // 3 second cycle at 60fps
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maze.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const viewportSize = mods.magnifier ? 7 : (mods.eagleEye ? 25 : (mods.sizeShifter ? (Math.round(Math.sin(frame * 0.1) * 4) + 20) : (level > 100 ? 21 : INITIAL_VIEWPORT_SIZE)));
    const canvasWidth = canvas.width;
    const cellSize = canvasWidth / viewportSize;

    // Camera follow
    let cameraX = playerPos.x - Math.floor(viewportSize / 2);
    let cameraY = playerPos.y - Math.floor(viewportSize / 2);

    if (mods.earthquake && isMoving) {
      cameraX += (Math.random() - 0.5) * 0.5;
      cameraY += (Math.random() - 0.5) * 0.5;
    }

    // Clamp camera
    cameraX = Math.max(0, Math.min(cameraX, maze[0].length - viewportSize));
    cameraY = Math.max(0, Math.min(cameraY, maze.length - viewportSize));

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mods.gravityFlip) {
      ctx.save();
      ctx.translate(canvasWidth / 2, canvas.height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-canvasWidth / 2, -canvas.height / 2);
    }

    const discoColor = `hsl(${frame * 6}, 70%, 50%)`;

    // Draw X-Ray Vision (Exit indicator through walls)
    if (mods.xRayVision && exitPos) {
      const screenX = (exitPos.x - cameraX) * cellSize + cellSize / 2;
      const screenY = (exitPos.y - cameraY) * cellSize + cellSize / 2;

      const onScreen = screenX >= 0 && screenX <= canvasWidth && screenY >= 0 && screenY <= canvas.height;

      if (!onScreen) {
        // Draw indicator at edge
        const edgeX = Math.max(20, Math.min(canvasWidth - 20, screenX));
        const edgeY = Math.max(20, Math.min(canvas.height - 20, screenY));
        ctx.fillStyle = "#22C55E";
        ctx.beginPath();
        ctx.arc(edgeX, edgeY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 2;
        ctx.strokeRect(edgeX - 8, edgeY - 8, 16, 16);
        ctx.globalAlpha = 1.0;
      } else {
        // Pulse at exit location even if "under" walls
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#22C55E";
        ctx.fillRect((exitPos.x - cameraX) * cellSize, (exitPos.y - cameraY) * cellSize, cellSize, cellSize);
        ctx.restore();
      }
    }

    // Draw Maze
    for (let y = 0; y < viewportSize; y++) {
      for (let x = 0; x < viewportSize; x++) {
        const mazeX = cameraX + x;
        const mazeY = cameraY + y;
        const cell = maze[mazeY]?.[mazeX];

        if (!cell || cell === "wall") {
          if (mods.ghostlyWalls) {
            ctx.globalAlpha = 0.3;
          }
          if (mods.matrixMode) {
            ctx.fillStyle = "#001100";
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.fillStyle = "#00FF00";
            ctx.font = `${cellSize * 0.5}px monospace`;
            if (Math.random() > 0.98) {
              ctx.fillText(Math.floor(Math.random() * 2).toString(), x * cellSize + cellSize / 4, y * cellSize + cellSize / 1.5);
            }
          } else {
            ctx.fillStyle = mods.discoMode ? discoColor : "#1a1a1a";
            ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);

            // Add some pixel texture to walls
            ctx.fillStyle = "#22C55E"; // Terminal Green
            ctx.globalAlpha = 0.1;
            ctx.fillRect(x * cellSize + 4, y * cellSize + 4, cellSize - 8, cellSize - 8);
            ctx.globalAlpha = 1.0;
          }
        } else if (cell === "exit") {
          ctx.fillStyle = mods.discoMode ? `hsl(${(frame * 6 + 180) % 360}, 70%, 50%)` : "#22C55E"; // Green exit
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          // Pulse effect
          const pulse = Math.sin(frame * 0.1) * 0.2 + 0.8;
          ctx.fillStyle = "white";
          ctx.globalAlpha = 0.3 * pulse;
          ctx.fillRect(x * cellSize + 5, y * cellSize + 5, cellSize - 10, cellSize - 10);
          ctx.globalAlpha = 1.0;
        } else {
          ctx.fillStyle = mods.discoMode ? "#000" : "#0a0a0a";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

          if (mods.neonPath) {
            ctx.save();
            ctx.strokeStyle = `hsl(${frame * 6 + (mazeX + mazeY) * 10}, 100%, 50%)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
            ctx.restore();
          }

          // Draw Trail Blazer
          if (mods.trailBlazer && visitedCells.has(`${mazeX},${mazeY}`)) {
            ctx.fillStyle = "#22C55E";
            ctx.globalAlpha = 0.2;
            ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
            ctx.globalAlpha = 1.0;
          }
        }
      }
    }

    // Draw Warp Portals
    if ((mods.warpPortals || mods.portalMaster) && portals.length >= 2) {
      portals.forEach((p, i) => {
        const screenX = (p.x - cameraX) * cellSize + cellSize / 2;
        const screenY = (p.y - cameraY) * cellSize + cellSize / 2;
        const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;

        ctx.save();
        ctx.beginPath();
        ctx.arc(screenX, screenY, (cellSize / 3) * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = i === 0 ? "#8B5CF6" : "#EC4899"; // Purple and Pink
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.globalAlpha = 0.3;
        ctx.fillStyle = i === 0 ? "#8B5CF6" : "#EC4899";
        ctx.fill();
        ctx.restore();
      });
    }

    // Draw Path Finder
    if (mods.pathFinder && solutionPath.length > 0) {
      ctx.strokeStyle = "#22C55E";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      solutionPath.forEach((p, i) => {
        const screenX = (p.x - cameraX) * cellSize + cellSize / 2;
        const screenY = (p.y - cameraY) * cellSize + cellSize / 2;
        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    }

    // Draw Player (Duck)
    let playerScreenX = (playerPos.x - cameraX) * cellSize;
    let playerScreenY = (playerPos.y - cameraY) * cellSize;

    if (mods.glitchDuck && Math.random() > 0.9) {
      playerScreenX += (Math.random() - 0.5) * 15;
      playerScreenY += (Math.random() - 0.5) * 15;
      ctx.globalAlpha = 0.5;
    }

    if (mods.camouflage) {
      ctx.globalAlpha = 0.15;
    }

    // Draw Ghost Trail
    if (mods.ghostTrail) {
      lastPos.forEach((p, i) => {
        const sx = (p.x - cameraX) * cellSize;
        const sy = (p.y - cameraY) * cellSize;
        ctx.globalAlpha = 0.3 - i * 0.05;
        ctx.fillStyle = customization.color;
        ctx.fillRect(sx + cellSize / 4, sy + cellSize / 4, cellSize / 2, cellSize / 2);
      });
      ctx.globalAlpha = 1.0;
    }

    // Draw Confetti Trail
    if (mods.confettiTrail && isMoving) {
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
        ctx.fillRect(
          playerScreenX + Math.random() * cellSize,
          playerScreenY + Math.random() * cellSize,
          4, 4
        );
      }
    }

    // Draw Vision Pulse Darkness
    if (mods.visionPulse || mods.nightVision || mods.fogOfWar) {
      const playerCenterX = playerScreenX + cellSize / 2;
      const playerCenterY = playerScreenY + cellSize / 2;

      let revealRadius = mods.nightVision ? cellSize * 4 : (mods.fogOfWar ? cellSize * 1.5 : cellSize * 1.2);
      if (!mods.nightVision && !mods.fogOfWar && pulseCycle < 60) {
        // Expanding pulse effect
        revealRadius = (pulseCycle / 60) * canvasWidth * 1.2;
      }

      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.globalAlpha = 0.98;
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.arc(playerCenterX, playerCenterY, revealRadius, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.restore();

      // Draw a subtle pulse ring
      if (pulseCycle < 60) {
        ctx.save();
        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1 - (pulseCycle / 60);
        ctx.beginPath();
        ctx.arc(playerCenterX, playerCenterY, revealRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    const pixelSize = cellSize / 8;
    const duckPixels = DUCK_PIXELS[direction];

    // Animation wobble
    const wobble = isMoving ? Math.round(Math.sin(frame * 0.3) * 2) : 0;

    const drawPixels = (pixels: number[][], colors: Record<number, string>) => {
      pixels.forEach((row, rowIdx) => {
        row.forEach((pixel, colIdx) => {
          if (pixel === 0 || !colors[pixel]) return;
          ctx.fillStyle = colors[pixel];
          const x = Math.floor(playerScreenX + colIdx * pixelSize);
          const y = Math.floor(playerScreenY + rowIdx * pixelSize + wobble);
          const w = Math.floor(playerScreenX + (colIdx + 1) * pixelSize) - x;
          const h = Math.floor(playerScreenY + (rowIdx + 1) * pixelSize + wobble) - y;
          ctx.fillRect(x, y, w, h);
        });
      });
    };

    const currentDuckColor = mods.rainbowDuck ? `hsl(${frame * 10}, 80%, 60%)` : customization.color;

    // Draw Duck
    drawPixels(duckPixels, {
      1: currentDuckColor,
      2: BEAK_COLOR,
      3: EYE_COLOR
    });

    // Draw Accessories Front
    Object.keys(ACCESSORIES).forEach(type => {
      const accessoryName = customization[type as keyof typeof customization];
      const accessoryPixels = ACCESSORIES[type]?.[accessoryName as string];
      if (accessoryPixels) {
        const customColors = ACCESSORY_COLORS[type]?.[accessoryName as string];
        drawPixels(accessoryPixels, customColors || {
          4: "#fff", // Primary Accessory Color
          5: "#555"  // Secondary Accessory Color
        });
      }
    });

    // Draw Compass
    if (mods.compass && exitPos) {
      const dx = exitPos.x - playerPos.x;
      const dy = exitPos.y - playerPos.y;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(playerScreenX + cellSize / 2, playerScreenY + cellSize / 2);
      ctx.rotate(angle);
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.moveTo(cellSize / 2 + 10, 0);
      ctx.lineTo(cellSize / 2, -5);
      ctx.lineTo(cellSize / 2, 5);
      ctx.fill();
      ctx.restore();
    }

    // Draw Minimap
    if (mods.minimap) {
      const mapSize = 80;
      const mapCellSize = mapSize / maze.length;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(canvasWidth - mapSize - 10, 10, mapSize, mapSize);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(canvasWidth - mapSize - 10, 10, mapSize, mapSize);

      maze.forEach((row, my) => {
        row.forEach((cell, mx) => {
          if (cell === "wall") {
            ctx.fillStyle = "#444";
            ctx.fillRect(canvasWidth - mapSize - 10 + mx * mapCellSize, 10 + my * mapCellSize, mapCellSize, mapCellSize);
          } else if (cell === "exit") {
            ctx.fillStyle = "#0f0";
            ctx.fillRect(canvasWidth - mapSize - 10 + mx * mapCellSize, 10 + my * mapCellSize, mapCellSize, mapCellSize);
          }
        });
      });
      // Player on minimap
      ctx.fillStyle = "#ff0";
      ctx.fillRect(canvasWidth - mapSize - 10 + playerPos.x * mapCellSize, 10 + playerPos.y * mapCellSize, mapCellSize, mapCellSize);
    }

    if (mods.hauntedMaze && frame % 120 < 40) {
      const ghostX = Math.floor(Math.sin(frame * 0.05) * 5) + playerPos.x;
      const ghostY = Math.floor(Math.cos(frame * 0.05) * 5) + playerPos.y;

      const gsx = (ghostX - cameraX) * cellSize;
      const gsy = (ghostY - cameraY) * cellSize;

      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(gsx + cellSize/2, gsy + cellSize/2, cellSize/3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (mods.strobe && Math.random() > 0.95) {
      ctx.fillStyle = "white";
      ctx.globalAlpha = 0.1;
      ctx.fillRect(0, 0, canvasWidth, canvas.height);
      ctx.globalAlpha = 1.0;
    }

    if (mods.staticNoise) {
      ctx.save();
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 100; i++) {
        ctx.globalAlpha = Math.random() * 0.1;
        ctx.fillRect(Math.random() * canvasWidth, Math.random() * canvas.height, 2, 2);
      }
      ctx.restore();
    }

    if (mods.gravityFlip) {
      ctx.restore();
    }

  }, [maze, playerPos, direction, frame, pulseCycle, isMoving, mods, solutionPath, level, customization, lastPos, continuousMoveCount]);

  const breakWall = useCallback(() => {
    if (!mods.wallBreaker || maze.length === 0) return;

    const targetX = playerPos.x + (direction === "left" ? -1 : direction === "right" ? 1 : 0);
    const targetY = playerPos.y + (direction === "up" ? -1 : direction === "down" ? 1 : 0);

    if (
      targetX > 0 && targetX < maze[0].length - 1 &&
      targetY > 0 && targetY < maze.length - 1 &&
      maze[targetY][targetX] === "wall"
    ) {
      setMaze(prev => {
        const next = [...prev.map(row => [...row])];
        next[targetY][targetX] = "path";
        return next;
      });
    }
  }, [mods.wallBreaker, maze, playerPos, direction]);

  const blinkDash = useCallback(() => {
    if (!mods.blinkDash || maze.length === 0) return;

    setPlayerPos(prev => {
      const getNext = (p: Position) => {
        const n = { ...p };
        if (direction === "up") n.y -= 2;
        if (direction === "down") n.y += 2;
        if (direction === "left") n.x -= 2;
        if (direction === "right") n.x += 2;
        return n;
      };

      const nextPos = getNext(prev);
      // Check if target is inside maze bounds and not a wall
      if (
        nextPos.x > 0 && nextPos.x < maze[0].length - 1 &&
        nextPos.y > 0 && nextPos.y < maze.length - 1 &&
        maze[nextPos.y][nextPos.x] !== "wall"
      ) {
        if (maze[nextPos.y][nextPos.x] === "exit") {
          setGameWon(true);
          setTimeout(() => setLevel(l => l + 1), 1500);
        }
        return nextPos;
      }
      return prev;
    });
  }, [mods.blinkDash, maze, direction]);

  const sonicBoom = useCallback(() => {
    if (!mods.sonicBoom || maze.length === 0) return;

    setMaze(prev => {
      const next = [...prev.map(row => [...row])];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = playerPos.x + dx;
          const ty = playerPos.y + dy;
          if (tx > 0 && tx < maze[0].length - 1 && ty > 0 && ty < maze.length - 1) {
            if (next[ty][tx] === "wall") next[ty][tx] = "path";
          }
        }
      }
      return next;
    });
  }, [mods.sonicBoom, maze, playerPos]);

  const jetpackJump = useCallback(() => {
    if (!mods.jetpack || maze.length === 0) return;
    setPlayerPos(prev => {
      const targetX = prev.x + (direction === "left" ? -2 : direction === "right" ? 2 : 0);
      const targetY = prev.y + (direction === "up" ? -2 : direction === "down" ? 2 : 0);
      if (targetX > 0 && targetX < maze[0].length - 1 && targetY > 0 && targetY < maze.length - 1 && maze[targetY][targetX] !== "wall") {
        return { x: targetX, y: targetY };
      }
      return prev;
    });
  }, [mods.jetpack, maze, direction]);

  const laserVision = useCallback(() => {
    if (!mods.laserVision || maze.length === 0) return;
    setMaze(prev => {
      const next = [...prev.map(row => [...row])];
      for (let i = 1; i <= 5; i++) {
        const tx = playerPos.x + (direction === "left" ? -i : direction === "right" ? i : 0);
        const ty = playerPos.y + (direction === "up" ? -i : direction === "down" ? i : 0);
        if (tx > 0 && tx < maze[0].length - 1 && ty > 0 && ty < maze.length - 1) {
          if (next[ty][tx] === "wall") next[ty][tx] = "path";
        }
      }
      return next;
    });
  }, [mods.laserVision, maze, playerPos, direction]);

  const nuclearBlast = useCallback(() => {
    if (!mods.nuclearBlast || maze.length === 0) return;
    setMaze(prev => {
      const next = [...prev.map(row => [...row])];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const tx = playerPos.x + dx;
          const ty = playerPos.y + dy;
          if (tx > 0 && tx < maze[0].length - 1 && ty > 0 && ty < maze.length - 1) {
            if (next[ty][tx] === "wall") next[ty][tx] = "path";
          }
        }
      }
      return next;
    });
  }, [mods.nuclearBlast, maze, playerPos]);

  const startMoving = (dir: "up" | "down" | "left" | "right") => {
    stopMoving();
    move(dir);
    const updateInterval = () => {
      let interval = mods.superSpeed ? 80 : 150;
      if (mods.timeWarp) interval *= 2;

      if (mods.speedDemon) {
        // Decrease interval (increase speed) based on continuous move count
        const speedBoost = Math.min(100, continuousMoveCount * 5);
        interval = Math.max(50, interval - speedBoost);
      }

      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = setInterval(() => {
        move(dir);
        if (mods.speedDemon) updateInterval(); // Dynamically update speed
      }, interval);
    };
    updateInterval();
  };

  const stopMoving = () => {
    setContinuousMoveCount(0);
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      stopMoving();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") move("up");
      if (e.key === "ArrowDown") move("down");
      if (e.key === "ArrowLeft") move("left");
      if (e.key === "ArrowRight") move("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [maze, playerPos, gameWon]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden font-mono">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-lg bg-surface-1 border border-border hover:border-primary transition-all active:scale-95 group"
        >
          <ArrowLeft size={18} className="text-muted-foreground group-hover:text-primary" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold text-primary">MAZE_RUNNER_v1.0</h1>
          <p className="text-[10px] text-muted-foreground">LVL: {level}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generateMaze(level, mods.randomExit)}
            className="p-2 rounded-lg bg-surface-1 border border-border hover:border-accent transition-all active:scale-95 group"
          >
            <RotateCcw size={18} className="text-muted-foreground group-hover:text-accent" />
          </button>
        </div>
      </header>

      {/* Game Screen */}
      <div className="flex-1 relative flex items-center justify-center bg-zinc-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={432}
          height={432}
          className={cn(
            "max-w-full aspect-square border-2 border-primary/20 shadow-[0_0_20px_rgba(34,197,94,0.1)] transition-all duration-300",
            mods.pixelate && "image-pixelated",
            mods.invertVisuals && "invert"
          )}
          style={{
            filter: mods.invertVisuals ? "invert(1)" : ""
          }}
        />

        {gameWon && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <Trophy size={64} className="text-primary mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-primary">LEVEL_COMPLETE!</h2>
            <p className="text-muted-foreground mt-2">Generating next level...</p>
          </div>
        )}
      </div>


      {/* Edit Duck Modal */}
      {showEditDuck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEditDuck(false)} />
          <div className="relative w-full max-w-xs bg-zinc-900 border border-white/10 rounded-2xl p-4 space-y-4 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] no-scrollbar shadow-2xl">
            <div className="flex items-center justify-between sticky top-0 bg-zinc-900 py-2 z-10">
              <h3 className="font-bold text-primary flex items-center gap-2 text-sm">
                <Shirt size={16} />
                CUSTOMIZE_DUCK
              </h3>
              <button onClick={() => setShowEditDuck(false)} className="text-muted-foreground hover:text-white">
                <X size={18} />
              </button>
            </div>

            <DuckLivePreview customization={customization} />

            <div className="grid grid-cols-2 gap-4">
              {/* Color Selection */}
              <div className="col-span-2 space-y-2 bg-black/20 p-3 rounded-xl border border-white/5">
                <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Duck Color</label>
                <div className="flex flex-wrap gap-2 justify-between">
                  {DUCK_COLORS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setCustomization(prev => ({ ...prev, color: c.value }))}
                      className={cn(
                        "w-6 h-6 rounded-md border-2 transition-all",
                        customization.color === c.value ? "border-primary scale-110 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "border-transparent opacity-60"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Accessories */}
              {Object.entries(ACCESSORIES).map(([type, items]) => (
                <div key={type} className="space-y-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <label className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{type}</label>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(items).map(name => (
                      <button
                        key={name}
                        onClick={() => setCustomization(prev => ({ ...prev, [type]: name }))}
                        className={cn(
                          "px-2 py-1 rounded-md border text-[8px] font-bold transition-all uppercase flex-1 text-center min-w-[40%]",
                          customization[type as keyof typeof customization] === name
                            ? "bg-primary text-black border-primary"
                            : "bg-black/40 text-muted-foreground border-white/10 hover:border-white/20"
                        )}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Level Jump Modal */}
      {showLevelJump && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLevelJump(false)} />
          <div className="relative w-full max-w-xs bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Hash size={18} />
                LEVEL_JUMP
              </h3>
              <button onClick={() => setShowLevelJump(false)} className="text-muted-foreground hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={jumpLevel}
                onChange={(e) => setJumpLevel(e.target.value)}
                placeholder="Level #"
                className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => {
                  const lvl = parseInt(jumpLevel);
                  if (!isNaN(lvl) && lvl > 0) {
                    setLevel(lvl);
                    setShowLevelJump(false);
                  }
                }}
                className="px-4 py-2 bg-primary text-black font-bold rounded-lg text-xs"
              >
                GO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mod Store Modal */}
      {showModStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModStore(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-0 flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-zinc-900 sticky top-0 z-20 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary flex items-center gap-2 text-sm uppercase tracking-tighter">
                  <ShoppingBag size={18} />
                  MOD_STORE_V2.0
                </h3>
                <button onClick={() => setShowModStore(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input
                  type="text"
                  placeholder="SEARCH_MODS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] text-primary focus:outline-none focus:border-primary transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar pb-20">
              {/* Special Action: Random Placement */}
              {(!searchQuery || "random placement".includes(searchQuery.toLowerCase())) && (
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-3 hover:border-primary/20 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-800 text-primary group-hover:scale-110 transition-transform">
                        <Dices size={18} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold">RANDOM PLACEMENT</h4>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Spawn the duck randomly anywhere in the maze.</p>
                      </div>
                    </div>
                    <button
                      onClick={randomizePosition}
                      className="px-3 py-1 bg-primary text-black text-[9px] font-bold rounded-lg hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                      ACTIVATE
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[8px]">
                    <div className="text-green-500/80 uppercase font-mono tracking-tighter">PROS:: BYPASS_SECTIONS</div>
                    <div className="text-red-500/80 uppercase font-mono tracking-tighter">CONS:: TELEPORT_AWAY</div>
                  </div>
                </div>
              )}

              {MOD_LIST.filter(m =>
                m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.description.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(mod => (
                <ModItem
                  key={mod.id}
                  icon={mod.icon}
                  title={mod.title}
                  description={mod.description}
                  pros={mod.pros}
                  cons={mod.cons}
                  active={mods[mod.id as keyof typeof mods]}
                  onToggle={() => setMods(m => ({ ...m, [mod.id]: !m[mod.id as keyof typeof mods] }))}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controller Area */}
      <div className="h-[280px] shrink-0 bg-zinc-900/50 border-t border-white/10 p-4 flex items-center justify-center relative gap-6">
        {/* Left Side Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShowModStore(true)}
            className="p-3 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center active:scale-95 hover:bg-zinc-800 transition-all shadow-lg"
            title="Mod Store"
          >
            <ShoppingBag size={18} className="text-primary" />
          </button>
          <button
            onClick={() => setShowEditDuck(true)}
            className="p-3 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center active:scale-95 hover:bg-zinc-800 transition-all shadow-lg"
            title="Edit Duck"
          >
            <Shirt size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* D-Pad Controller */}
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full max-w-[200px]">
          <div />
          <ControlButton icon={ChevronUp} onStart={() => startMoving("up")} onStop={stopMoving} className="col-start-2" />
          <div />

          <ControlButton icon={ChevronLeft} onStart={() => startMoving("left")} onStop={stopMoving} className="row-start-2 col-start-1" />
          <div className="flex flex-col items-center justify-center gap-1">
             {mods.wallBreaker && (
               <button
                 onClick={breakWall}
                 className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center active:scale-95 transition-all"
                 title="Wall Breaker"
               >
                 <Flame size={14} className="text-red-500" />
               </button>
             )}
             {mods.sonicBoom && (
               <button
                 onClick={sonicBoom}
                 className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center active:scale-95 transition-all"
                 title="Sonic Boom"
               >
                 <Bomb size={14} className="text-orange-500" />
               </button>
             )}
             {mods.blinkDash && (
               <button
                 onClick={blinkDash}
                 className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center active:scale-95 transition-all"
                 title="Blink Dash"
               >
                 <Wind size={14} className="text-blue-500" />
               </button>
             )}
             {mods.jetpack && (
               <button
                 onClick={jetpackJump}
                 className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center active:scale-95 transition-all"
                 title="Jetpack"
               >
                 <Rocket size={14} className="text-purple-500" />
               </button>
             )}
             {mods.laserVision && (
               <button
                 onClick={laserVision}
                 className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center active:scale-95 transition-all"
                 title="Laser Vision"
               >
                 <Aperture size={14} className="text-cyan-500" />
               </button>
             )}
             {mods.nuclearBlast && (
               <button
                 onClick={nuclearBlast}
                 className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center active:scale-95 transition-all"
                 title="Nuclear Blast"
               >
                 <Radiation size={14} className="text-yellow-500" />
               </button>
             )}
             {!mods.wallBreaker && !mods.sonicBoom && !mods.blinkDash && (
               <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
             )}
          </div>
          <ControlButton icon={ChevronRight} onStart={() => startMoving("right")} onStop={stopMoving} className="row-start-2 col-start-3" />

          <div />
          <ControlButton icon={ChevronDown} onStart={() => startMoving("down")} onStop={stopMoving} className="row-start-3 col-start-2" />
          <div />
        </div>

        {/* Right Side Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center active:scale-95 hover:bg-zinc-800 transition-all shadow-lg"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize size={18} className="text-zinc-400" /> : <Maximize size={18} className="text-zinc-400" />}
          </button>
          <button
            onClick={() => setShowLevelJump(true)}
            className="p-3 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center active:scale-95 hover:bg-zinc-800 transition-all shadow-lg"
            title="Level Jump"
          >
            <Hash size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* Level Indicator for Mobile */}
        <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground font-mono bg-black/40 px-2 py-1 rounded border border-white/5">
          STATUS::OK
        </div>
      </div>
    </div>
  );
};

interface ModItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  pros: string;
  cons: string;
  active: boolean;
  onToggle: () => void;
}

const ModItem = ({ icon: Icon, title, description, pros, cons, active, onToggle }: ModItemProps) => (
  <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-3">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-zinc-800", active ? "text-primary" : "text-zinc-500")}>
          <Icon size={18} />
        </div>
        <div>
          <h4 className="text-[11px] font-bold">{title}</h4>
          <p className="text-[9px] text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "w-8 h-4 rounded-full transition-colors relative shrink-0 mt-1",
          active ? "bg-primary" : "bg-zinc-700"
        )}
      >
        <div className={cn(
          "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
          active ? "left-[18px]" : "left-0.5"
        )} />
      </button>
    </div>
    <div className="grid grid-cols-2 gap-2 text-[8px]">
      <div className="text-green-500/80 uppercase">PROS:: {pros}</div>
      <div className="text-red-500/80 uppercase">CONS:: {cons}</div>
    </div>
  </div>
);

const ControlButton = ({ icon: Icon, onStart, onStop, className }: { icon: any, onStart: () => void, onStop: () => void, className?: string }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onStart(); }}
    onTouchStart={(e) => { e.preventDefault(); onStart(); }}
    onMouseUp={(e) => { e.preventDefault(); onStop(); }}
    onMouseLeave={(e) => { e.preventDefault(); onStop(); }}
    onTouchEnd={(e) => { e.preventDefault(); onStop(); }}
    className={cn(
      "w-full aspect-square rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center active:scale-95 active:bg-primary/20 active:border-primary transition-all shadow-lg",
      className
    )}
  >
    <Icon size={24} className="text-zinc-400" />
  </button>
);

export default MazeGame;
