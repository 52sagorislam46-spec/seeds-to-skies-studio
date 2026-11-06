import type { Post } from "./types";

/**
 * In-app preloaded reels: shown in the Reels feed alongside real Firebase reels
 * so the feed is never empty and costs no Firestore reads/writes.
 * Ids start with "pre_" — likes/comments/shares on these stay local only.
 */
export const PRELOADED_PREFIX = "pre_";
export const isPreloadedReel = (id: string) => id.startsWith(PRELOADED_PREFIX);

const CREATORS = [
  { id: "rafi", name: "রাফি আহমেদ", user: "rafi.vibes", img: 12 },
  { id: "nusrat", name: "নুসরাত জাহান", user: "nusrat_daily", img: 47 },
  { id: "tanvir", name: "Tanvir Hasan", user: "tanvir.travels", img: 15 },
  { id: "mim", name: "মিম আক্তার", user: "mim.life", img: 44 },
  { id: "arif", name: "Arif Khan", user: "arif_motivation", img: 33 },
  { id: "sadia", name: "সাদিয়া ইসলাম", user: "sadia.art", img: 49 },
  { id: "jisan", name: "Jisan Rahman", user: "jisan.tech", img: 59 },
  { id: "priya", name: "প্রিয়া দাস", user: "priya_moments", img: 45 },
];

const CAPTIONS: [string, string[]][] = [
  ["প্রকৃতির এই সৌন্দর্য মন ভালো করে দেয় 🌿", ["nature", "bangla", "reels"]],
  ["আজকের দিনটা একদম অন্যরকম ছিল ✨", ["lifestyle", "viral", "fyp"]],
  ["কখনো হাল ছেড়ো না, সফলতা আসবেই 💪", ["motivation", "bangla"]],
  ["ঘুরতে যাওয়ার সেরা জায়গা 😍", ["travel", "reels", "viral"]],
  ["এই মুহূর্তটা ভুলবো না কখনো ❤️", ["moments", "fyp"]],
  ["শান্তির খোঁজে একটু বেরিয়ে পড়া 🚶", ["travel", "nature"]],
  ["ভিডিওটা শেষ পর্যন্ত দেখো 🔥", ["viral", "trending", "fyp"]],
  ["Weekend vibes only 🎶", ["vibes", "reels"]],
];

const VIDEO_IDS = [
  34487, 4883, 1171, 39767, 42294, 4813, 1164, 3248, 2244, 34404, 44347, 41576,
  47583, 50846, 4007, 39894, 42925, 43028, 1610, 2098, 4697, 18294, 23345,
];

const HOUR = 3600_000;
const BASE = Date.UTC(2026, 9, 25);

const STOCK_REELS: Post[] = VIDEO_IDS.map((vid, i) => {
  const c = CREATORS[i % CREATORS.length]!;
  const [text, tags] = CAPTIONS[(i * 3) % CAPTIONS.length]!;
  const views = 1200 + ((vid * 37) % 98000);
  return {
    id: `${PRELOADED_PREFIX}${vid}`,
    authorId: `${PRELOADED_PREFIX}${c.id}`,
    authorName: c.name,
    authorUsername: c.user,
    authorPhoto: `https://i.pravatar.cc/150?img=${c.img}`,
    text: `${text} ${tags.map((t) => `#${t}`).join(" ")}`,
    mediaUrl: `https://assets.mixkit.co/videos/${vid}/${vid}-720.mp4`,
    mediaType: "video/mp4",
    likes: [],
    comments: [],
    tags,
    views,
    shares: Math.floor(views / 90),
    createdAt: BASE - i * 5 * HOUR,
  };
});

/** Real-life videos with sound (Wikimedia Commons, freely licensed), hosted on our CDN. */
const REAL_VIDEOS: [string, string, string[]][] = [
  ["/__l5e/assets-v1/ae0b063d-df01-4a90-afdf-935b786dfe06/real-reel-4.mp4", "বন্ধুরা মিলে মজার নাচ 😂💃", ["funny", "reels"]],
  ["/__l5e/assets-v1/a4b24a1b-cf1f-4e8a-8162-e7e5917d639e/real-reel-3.mp4", "রাস্তার পাশে ডিমের পিঠা বানানো, দেখলেই জিভে জল 🤤", ["food", "reels"]],
  ["/__l5e/assets-v1/23c8924a-bf70-4d64-a0fc-5d3ed02407b8/real-reel-5.mp4", "বিড়ালটার দুষ্টুমি দেখে হাসি থামাতে পারবে না 😹", ["pets", "reels"]],
  ["/__l5e/assets-v1/d8ff330a-fb63-430f-931f-5c103c0c59c8/real-reel-11.mp4", "রাস্তায় হঠাৎ সবাই মিলে নাচ শুরু 🎉", ["dance", "reels"]],
  ["/__l5e/assets-v1/cb9cd17b-11b8-4042-a92c-d2cc6ddcb5e4/real-reel-27.mp4", "বগুড়ায় দেশি পদ্ধতিতে মাছ ধরা 🇧🇩🎣", ["village", "reels"]],
  ["/__l5e/assets-v1/73167711-bc6e-4288-b5e8-573ee03b27ee/real-reel-1.mp4", "সমুদ্রের পাড়ে আমাদের কুকুরটার আনন্দ দেখো 🐶🌊", ["pets", "reels"]],
  ["/__l5e/assets-v1/e36e0379-f67c-459a-b0ef-6b75f47acd8e/real-reel-24.mp4", "ব্যাংককের রাস্তায় স্কুইড ভাজা, ঝাল ঝাল 🌶️", ["food", "reels"]],
  ["/__l5e/assets-v1/56e1281c-a327-4562-ac49-82d407c05d16/real-reel-18.mp4", "গলিতে বন্ধুদের সাথে ছোটবেলার খেলা, মনে পড়ে? 🥹", ["kids", "reels"]],
  ["/__l5e/assets-v1/09f3cc0f-5df7-4132-a7ef-b6500c89a8a4/real-reel-2.mp4", "ঐতিহ্যবাহী নাচ, ঢোলের তালে মন নেচে উঠবে 🥁", ["dance", "reels"]],
  ["/__l5e/assets-v1/283f9ec5-ced8-49a4-97e7-99d91a8affe7/real-reel-28.mp4", "নৌকায় ভাসমান ফলের বাজার, কখনো দেখেছো? 🛶🍉", ["travel", "reels"]],
  ["/__l5e/assets-v1/e8a5f62e-8df8-45ad-9dec-720a5176af15/real-reel-19.mp4", "দুই বিড়ালের খেলা, কে জিতবে? 🐱", ["pets", "reels"]],
  ["/__l5e/assets-v1/8d74c709-9411-4f02-ae76-87d65e5e2c2f/real-reel-9.mp4", "পাহাড়ি স্টাইলে মাংস রান্না, একদম আলাদা 🔥", ["food", "reels"]],
  ["/__l5e/assets-v1/197f8741-122d-4968-a3c8-e6d92a1778bd/real-reel-16.mp4", "খেলার মাঠে বাচ্চাদের হইচই 😄", ["kids", "reels"]],
  ["/__l5e/assets-v1/247b9c0c-49f7-4b11-8174-5f3b3ea834c9/real-reel-20.mp4", "পাহাড়ের মঠে রঙিন মুখোশ উৎসব 🎭", ["festival", "reels"]],
  ["/__l5e/assets-v1/a423af91-c208-4d7c-ad28-74c5a20e6606/real-reel-32.mp4", "মায়ের হাতের রান্না, সবচেয়ে প্রিয় 🍲", ["food", "reels"]],
  ["/__l5e/assets-v1/1bc6824e-9230-4a85-85c6-e216c8ad15e7/real-reel-14.mp4", "নদীতে মাছ ধরার মজাই আলাদা 🎣", ["village", "reels"]],
  ["/__l5e/assets-v1/cf97a6fb-46fa-4871-9113-06b5a4d1be0b/real-reel-21.mp4", "একাই পুরো মঞ্চ মাতিয়ে দিলো 🔥", ["dance", "reels"]],
  ["/__l5e/assets-v1/f03ce1a1-967d-4b89-a826-32edc43ba1d8/real-reel-25.mp4", "হাতে বানানো ডাম্পলিং, শেষ পর্যন্ত দেখো 🥟", ["food", "reels"]],
  ["/__l5e/assets-v1/fa4cb83e-c0bf-4ebc-9f70-9c3a578969a8/real-reel-12.mp4", "উৎসবের দিনে গ্রামের সবাই একসাথে 🎊", ["festival", "reels"]],
  ["/__l5e/assets-v1/97935bb8-92ee-49a9-8fc2-b7799ef549f5/real-reel-17.mp4", "স্কুলের বাচ্চারা শিক্ষকের সাথে খেলছে ❤️", ["kids", "reels"]],
  ["/__l5e/assets-v1/209d7405-277a-402f-8298-06667d800b39/real-reel-10.mp4", "আজ বাসায় স্যালমন মাছ ভাজলাম 🐟", ["food", "reels"]],
  ["/__l5e/assets-v1/de70d382-3728-46d1-92c4-1321905794f0/real-reel-29.mp4", "লোকনৃত্যে মেতে উঠলো সবাই 🎶", ["dance", "reels"]],
  ["/__l5e/assets-v1/25ea57a2-7e40-4208-bedf-731c2645dbf0/real-reel-13.mp4", "গ্রামের সহজ সরল জীবন, এটাই আসল শান্তি 🏡", ["village", "reels"]],
  ["/__l5e/assets-v1/212acc6d-9a2d-469f-bdfc-c80a2d6fecaf/real-reel-26.mp4", "পাহাড়ি গ্রামের সাংস্কৃতিক নাচ 💃", ["dance", "reels"]],
  ["/__l5e/assets-v1/b264832d-27a7-4ab7-adc3-5e9c6706dcad/real-reel-15.mp4", "রেট্রো উৎসবে পুরনো দিনের গাড়ি আর গান 🚗🎶", ["festival", "reels"]],
  ["/__l5e/assets-v1/f04a9e56-b1a4-4b7f-a5a8-b93923c83255/real-reel-31.mp4", "পাহাড়ি গ্রামের একটা সকাল ⛰️", ["travel", "reels"]],
  ["/__l5e/assets-v1/5047ca7d-da13-4ea0-a4e6-6df692b596cc/real-reel-33.mp4", "সহজ রেসিপি: আদা-পেঁয়াজ দিয়ে ডিম ভাত 🍳", ["food", "reels"]],
];

const REAL_REELS: Post[] = REAL_VIDEOS.map(([url, text, tags], i) => {
  const c = CREATORS[(i * 5 + 3) % CREATORS.length]!;
  const views = 8000 + ((i * 7919) % 240000);
  const id = url.split("/").pop()!.replace(".mp4", "");
  return {
    id: `${PRELOADED_PREFIX}${id}`,
    authorId: `${PRELOADED_PREFIX}${c.id}`,
    authorName: c.name,
    authorUsername: c.user,
    authorPhoto: `https://i.pravatar.cc/150?img=${c.img}`,
    text,
    mediaUrl: url,
    mediaType: "video/mp4",
    likes: [],
    comments: [],
    tags,
    views,
    shares: Math.floor(views / 70),
    createdAt: BASE - i * 3 * HOUR,
  };
});

// Only real videos with sound are shown. STOCK_REELS (no audio track) are kept
// in code but excluded from the feed per owner request.
void STOCK_REELS;
// Sports reels (free Pexels clips, verified to have audible sound).
const SPORTS_VIDEOS: [string, string, string[]][] = [
  ["/__l5e/assets-v1/3f852b13-c364-41f3-8e84-8bef345375fe/sports-reel-01.mp4", "ফুটবল স্কিল দেখে মাথা ঘুরে যাবে ⚽🔥", ["football", "skills", "viral"]],
  ["/__l5e/assets-v1/5c240d23-ac33-47e7-95cc-e9920a8eff7c/sports-reel-02.mp4", "মেসির মতো ড্রিবলিং চেষ্টা 😎⚽", ["football", "messi", "fyp"]],
  ["/__l5e/assets-v1/86fcff9b-3277-44e8-a734-d03e5d98bf2e/sports-reel-03.mp4", "রোনালদো স্টাইল ফ্রি কিক প্র্যাকটিস 💪", ["football", "ronaldo", "reels"]],
  ["/__l5e/assets-v1/db5e82c8-5ea5-499c-ade0-558f75725ea2/sports-reel-04.mp4", "বল কন্ট্রোল লেভেল: প্রো ⚽", ["football", "skills"]],
  ["/__l5e/assets-v1/e4d0cca2-5319-4318-906f-029590be5d3d/sports-reel-05.mp4", "প্রতিদিনের ফুটবল ট্রেনিং 🏃‍♂️", ["football", "training", "viral"]],
  ["/__l5e/assets-v1/bba253d2-9840-41ae-8ff7-421baf02fb8d/sports-reel-06.mp4", "এই ট্রিকটা শিখে নাও 👀⚽", ["football", "trick", "fyp"]],
  ["/__l5e/assets-v1/89ab2ff3-b09f-4149-99f9-7e81a589db00/sports-reel-07.mp4", "মাঠের খেলা, আসল মজা ⚽❤️", ["football", "soccer", "reels"]],
  ["/__l5e/assets-v1/e0b82aec-0d46-4b2a-a73d-5e0ed002f1b5/sports-reel-08.mp4", "গোওওওল! 🥅🔥", ["football", "goal", "viral"]],
  ["/__l5e/assets-v1/a9595b07-d366-448f-9c1c-e50c0aaec73f/sports-reel-09.mp4", "বন্ধুদের সাথে বিকেলের ম্যাচ ⚽", ["football", "friends", "fyp"]],
  ["/__l5e/assets-v1/c5a92fc4-d49c-44cc-a01a-73d230287675/sports-reel-10.mp4", "পাসিং গেম একদম পারফেক্ট 👌", ["football", "soccer"]],
  ["/__l5e/assets-v1/1d50d622-e6a0-4bfe-b25c-a3b627534de1/sports-reel-11.mp4", "ফুটবল পাগলদের জন্য ⚽🔥", ["football", "viral", "reels"]],
  ["/__l5e/assets-v1/0d03931d-a6f6-4103-8cf9-74c8bb7161e6/sports-reel-12.mp4", "শেষ পর্যন্ত দেখো, দারুণ মুভ 😍", ["football", "skills", "fyp"]],
  ["/__l5e/assets-v1/d147f634-1702-4f7b-bc68-8b2e659e15e3/sports-reel-13.mp4", "বাস্কেটবলের দারুণ শট 🏀", ["basketball", "sports", "viral"]],
];

const SPORTS_REELS: Post[] = SPORTS_VIDEOS.map(([url, text, tags], i) => {
  const c = CREATORS[(i * 3 + 1) % CREATORS.length]!;
  const views = 15000 + ((i * 6151) % 300000);
  const id = url.split("/").pop()!.replace(".mp4", "");
  return {
    id: `${PRELOADED_PREFIX}${id}`,
    authorId: `${PRELOADED_PREFIX}${c.id}`,
    authorName: c.name,
    authorUsername: c.user,
    authorPhoto: `https://i.pravatar.cc/150?img=${c.img}`,
    text,
    mediaUrl: url,
    mediaType: "video/mp4",
    likes: [],
    comments: [],
    tags,
    views,
    shares: Math.floor(views / 60),
    createdAt: BASE - i * 4 * HOUR - HOUR,
  };
});

// Mix: after every 2 original reels, one sports reel. All original reels kept.
const mixed: Post[] = [];
REAL_REELS.forEach((r, i) => {
  mixed.push(r);
  const s = SPORTS_REELS[Math.floor(i / 2)];
  if (i % 2 === 1 && s) mixed.push(s);
});
SPORTS_REELS.slice(Math.ceil(REAL_REELS.length / 2)).forEach((s) => {
  if (!mixed.includes(s)) mixed.push(s);
});
export const PRELOADED_REELS: Post[] = mixed;
