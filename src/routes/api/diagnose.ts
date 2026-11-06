import { createFileRoute } from "@tanstack/react-router";
import { groqStream } from "@/lib/groq.server";
import { geminiStream, dataUrlPart, type GContent, type GPart } from "@/lib/gemini.server";

const SYSTEM = `তুমি "Fly Agro" — বাংলাদেশের কৃষকের বন্ধু, একজন অভিজ্ঞ কৃষিবিদ, পশু চিকিৎসক ও মৎস্য বিশেষজ্ঞ। সবসময় সহজ, আঞ্চলিক কৃষক বুঝতে পারে এমন বাংলায় উত্তর দেবে।
ছবি দেখে নিচের কাঠামোতে উত্তর দাও (Markdown শিরোনাম ব্যবহার করবে):
## 🔍 শনাক্তকরণ
(এটা কী — ফসল/গাছ/পশু/পাখি/মাছের নাম)
## 🩺 রোগ বা সমস্যা
(রোগের নাম বাংলা ও ইংরেজিতে, নিশ্চয়তার মাত্রা, লক্ষণ)
## 💊 প্রতিকার ও ঔষধ
(বাংলাদেশে পাওয়া যায় এমন ঔষধের জেনেরিক নাম ও প্রচলিত ব্র্যান্ড নাম, মাত্রা যেমন প্রতি লিটার পানিতে কত গ্রাম/মিলি, কখন ও কীভাবে প্রয়োগ)
## 🌿 জৈব/ঘরোয়া সমাধান
## 🛡️ প্রতিরোধে করণীয়
## ⚠️ সতর্কতা
(ঔষধ ব্যবহারে সাবধানতা; প্রয়োজনে নিকটস্থ উপজেলা কৃষি অফিস / প্রাণিসম্পদ অফিস / মৎস্য অফিস বা কৃষি কল সেন্টার ১৬১২৩ এ যোগাযোগের পরামর্শ)
ছবি সুস্থ হলে সেটা বলো এবং যত্নের পরামর্শ দাও। ছবি সাধারণ মানের বা একটু অস্পষ্ট হলেও কখনো "আরও পরিষ্কার ছবি দিন" বলে উত্তর এড়াবে না — যা দেখা যাচ্ছে তা থেকে আত্মবিশ্বাসের সাথে সবচেয়ে সম্ভাব্য শনাক্তকরণ ও রোগ বলবে (প্রয়োজনে ২-৩টি সম্ভাব্য রোগ শতাংশসহ)।
সবশেষে অবশ্যই থাকবে:
## 📚 সূত্র ও প্রমাণ
(তথ্যের নির্ভরযোগ্য উৎস লিংকসহ — যেমন BARI http://www.bari.gov.bd, BRRI http://www.brri.gov.bd, কৃষি সম্প্রসারণ অধিদপ্তর http://www.dae.gov.bd, প্রাণিসম্পদ অধিদপ্তর http://www.dls.gov.bd, মৎস্য অধিদপ্তর http://www.fisheries.gov.bd, IRRI Rice Knowledge Bank, FAO, CABI Plantwise — শুধু প্রাসঙ্গিকগুলো; বানানো লিংক দেবে না) এবং কৃষি কল সেন্টার ১৬১২৩।
অনুসরণমূলক প্রশ্নে আগের আলোচনা মনে রেখে সংক্ষেপে ও নির্দিষ্টভাবে উত্তর দাও।
গুরুত্বপূর্ণ নিয়ম: ছবিটি যদি ফসল, গাছপালা, মাটি, পশু, পাখি বা মাছের না হয় (যেমন চেয়ার, টেবিল, মোবাইল, মানুষ, ঘর, গাড়ি ইত্যাদি), তাহলে উপরের কাঠামো ব্যবহার করবে না, রোগ/ঔষধ/সতর্কতা/সূত্র অংশ দেবে না এবং কখনো "কৃষি অফিস/কৃষি দপ্তর/১৬১২৩-এ যোগাযোগ করুন" বলবে না। শুধু সংক্ষেপে বলবে জিনিসটি কী, তারপর লিখবে: "এটি কৃষি, গাছপালা, পশুপাখি বা মাছের ছবি নয়। অনুগ্রহ করে আপনার আক্রান্ত ফসল, গাছ, পশু, পাখি বা মাছের ছবি দিন।"
কৃষি অফিস/প্রাণিসম্পদ অফিস/১৬১২৩-এ যোগাযোগের পরামর্শ কেবল তখনই দেবে যখন সত্যিই গুরুতর রোগ, দ্রুত ছড়াচ্ছে, পশু মারা যাচ্ছে বা মাঠপর্যায়ে পরীক্ষা দরকার। সুস্থ ফসল বা সাধারণ সমস্যায় এই পরামর্শ দেবে না।
গণনা নিয়ম: কৃষক যদি "গুনে দাও", "গণনা করো", "কতগুলো", "কয়টা", "count" ইত্যাদি বলে, তাহলে রোগের কাঠামো ব্যবহার করবে না। ছবিটিকে মনে মনে সারি/গ্রিডে ভাগ করে প্রতিটি অংশ আলাদাভাবে ধৈর্য ধরে একটি একটি করে গুনবে, আংশিক দেখা ও একটির উপর আরেকটি থাকা জিনিসও ধরবে, তারপর আবার গুনে মিলিয়ে নেবে। উত্তর দেবে এভাবে:
## 🔢 গণনার ফলাফল
**মোট: X টি** (বস্তুর নাম)
- অংশভিত্তিক হিসাব (যেমন উপরের সারি ১২, মাঝের ১৫ …)
- নিশ্চয়তা: উচ্চ/মাঝারি
যদি জিনিস অত্যন্ত ঘন বা শত শত হয় এবং একটি একটি করে গোনা সম্ভব না হয়, তাহলে ছোট একটি অংশ গুনে পুরো এলাকার সাথে গুণ করে আনুমানিক সংখ্যা ও সম্ভাব্য পরিসর (যেমন ৪৮০–৫২০) দেবে এবং পদ্ধতি ব্যাখ্যা করবে। কখনো মনগড়া সংখ্যা বলবে না। গণনার উত্তরে সূত্র বা কৃষি অফিসের কথা লাগবে না।`;

export const Route = createFileRoute("/api/diagnose")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { image, question, category, history } = (await request.json()) as { image?: string; question?: string; category?: string; history?: Array<{ role: "user" | "assistant"; content: string }> };
        if (!image || !image.startsWith("data:image/")) {
          return new Response("একটি ছবি দিন।", { status: 400 });
        }
        if (!process.env["GEMINI_API_KEY"]) return new Response("সার্ভার কনফিগারেশন সমস্যা।", { status: 500 });
        const imgPart = dataUrlPart(image);
        const first: GPart[] = [
          {
            text: [
              category?.trim() ? `কৃষক বলেছন এটা: ${category.trim()}।` : "",
              question?.trim()
                ? `কৃষকের প্রশ্ন: ${question.trim()}`
                : "এই ছবিতে কী আছে এবং কোনো রোগ বা সমস্যা থাকলে তার সমাধান বলো।",
            ].filter(Boolean).join("\n"),
          },
          ...(imgPart ? [imgPart] : []),
        ];
        const contents: GContent[] = [
          { role: "user", parts: first },
          ...(history ?? [])
            .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
            .slice(-12)
            .map((m): GContent => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content.slice(0, 6000) || "..." }] })),
        ];
        let r = await geminiStream(SYSTEM, contents, request.signal);
        if ("status" in r) {
          const txt = contents.flatMap((c) => c.parts).map((p) => ("text" in p ? p.text : "")).join("\n");
          const g = await groqStream([{ role: "system", content: SYSTEM }, { role: "user", content: txt }], request.signal);
          if (!("status" in g)) r = g;
        }
        if ("status" in r) {
          const msg =
            r.status === 429
              ? "এখন অনেক অনুরোধ আসছে, একটু পরে আবার চেষ্টা করুন।"
              : "বিশ্লেষণ করা যায়নি, আবার চেষ্টা করুন।";
          return new Response(msg, { status: r.status || 500 });
        }
        return new Response(r.stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
