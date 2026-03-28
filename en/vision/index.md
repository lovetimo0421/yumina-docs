# Vision

## Open Source

Yumina started as a personal project: a fork of SillyTavern with an improved UI, integrated with the Godot game engine. But SillyTavern's original architecture was born in the era of pure text simulation, and despite the countless open-source contributors who built plugins over the years, its foundational structure was always going to limit how far it could evolve toward AI-native games and interactive cinema.

Today's Yumina has grown into something with its own independent AI-native game engine, multiplayer support, and multi-agent world capabilities. Just as SillyTavern's greatest extensions came from the open-source community's contributions, we believe Yumina belongs to the community too — and only the community can make it better. Yumina is fully open source, from the game engine to the frontend. You don't need to log in to use your own API locally for creating, playing, and building new features.

## Why Centralize & Commercialize

So why didn't we stop at a completely free and open-source app? Not because we didn't want to — but because we couldn't.

The AI roleplay space is polarizing right now. On one end are commercial apps that operate almost entirely closed-source, with heavy content restrictions, and sometimes outright stealing work from the open-source creator community. On the other end are communities that, for historical reasons, have a deep ideological opposition to anything commercial or centralized. But in both extremes, the ones who suffer are always the creators who build for the love of it.

Creator rights — whether on centralized commercial platforms or in open-source communities — are often left unprotected. Commercial platforms steal their work and profit from it; releasing work fully into the open is, in effect, asking every writer to put their books up as free PDFs on a public forum. Neither extreme, taken to its limit, can protect the most basic intellectual property rights and incentive structures for creators.

That's why, alongside open-sourcing the product, we also built a centralized website. On this website, creators choose for themselves: allow downloads and editing, allow commercial use, or restrict both. If a creator wants to fully open their work at no cost, anyone can download it or experience it using their own API. If a creator wants to commercialize and restrict downloads, players who want to play must go through the platform's official Credits system. Only this way can creators earn revenue while ensuring their content isn't easily stolen — much like today's web fiction platforms. Creators can even choose "non-commercial but no free download" — preserving IP rights while still letting players experience the work using the official API, with neither creator nor platform taking a cut. (See the Creator Revenue section for details.)

From the player's and platform's perspective, this also makes sense. Most players won't clone an entire GitHub repository — many just want to open a world and start chatting, anytime and anywhere, on your website. And a significant portion of those players are free users. These needs are things a purely open-source app simply cannot meet on its own.

## Protecting Creators & Players

Because the architectural differences are too significant — and to prevent bad actors in the open-source community from stealing cards — Yumina will not support importing SillyTavern's JSON format. Born from the community, Yumina fully respects all intellectual property and copyright, and absolutely prohibits any form of plagiarism. Our first fully developed system was the reporting system. We actively search for plagiarized works and enforce bans and takedowns, but we also encourage the community to participate: on every world's detail page you can submit reports and upload evidence.

While simple plagiarism is easy to identify, the real world is rarely that simple. For example: the first creator of a fan work built around an anime's plot, illustrations, and music — do they have the right to prevent other creators from making similar fan works? How unique must a jailbreak or writing style description be before it counts as a creator's personal intellectual property? These lines are often blurry. That's why all reported content and outcomes are publicly posted in the Discord community, where players can request review or vote on plagiarism determinations.

## Creator Revenue

We adopted a blockchain-inspired recording approach where every token consumed by a player using the official API is logged in a traceable, tamper-resistant way. Whether the player is on a free tier or a paid tier, creators can clearly see every single transaction. What's recorded is token usage — not the player's chat history. Verifying this system is simple: you can audit our open-source code directly, or use an alt account to play your own published world and verify it yourself.

The revenue split is straightforward: creators receive **80%** of the revenue from player token usage after deducting costs. We offer Stripe, cryptocurrency, and other withdrawal options. Since the platform currently has no ads and no other revenue streams, that 20% funds the free user quota, website maintenance, image hosting, and server operations.

In the traditional game publishing industry, creators typically keep only 10–20%. Even book publishing royalties are usually around 10%. On UGC platforms like Roblox or Fortnite, creators typically earn around 30% of revenue. AI itself is more like manufacturing than traditional internet — user growth brings proportional or even exponential cost increases.

But even so, we believe the era of "platform takes 80%, creators get 20%" is over. Going forward, only platforms that genuinely serve their creators will deserve to survive.

## Privacy & Security

If you use our local version, all your data stays entirely on your own computer.

On the web version, we store chat history only to keep the product functioning. Users can delete and export their data at any time. Private chat is never used for advertising, data sales or sharing, or model training. We protect user privacy in accordance with GDPR data protection principles, and all data is currently stored on AWS in the US.

We believe the law is the floor, not the ceiling — we hold ourselves to higher ethical standards. We will take every measure to ensure that users' data is never compromised.
