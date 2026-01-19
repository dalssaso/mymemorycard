# Changelog

## [2.0.0](https://github.com/dalssaso/mymemorycard/compare/backend-v1.3.0...backend-v2.0.0) (2026-01-19)


### ⚠ BREAKING CHANGES

* POST /api/v1/credentials/validate response now returns is_valid instead of valid.

### Features

* add embeddings infrastructure for ai features ([#27](https://github.com/dalssaso/mymemorycard/issues/27)) ([9d78fa2](https://github.com/dalssaso/mymemorycard/commit/9d78fa2862da90b7f06dcfafc65c571893bd8a61))
* complete b0.5 user-platforms di migration ([#40](https://github.com/dalssaso/mymemorycard/issues/40)) ([fb6e8ff](https://github.com/dalssaso/mymemorycard/commit/fb6e8ff305c9e83df6b24c0807441843d8c612b6))
* complete b0.6 preferences domain di migration ([#42](https://github.com/dalssaso/mymemorycard/issues/42)) ([dcf9d57](https://github.com/dalssaso/mymemorycard/commit/dcf9d57dcefa0ff2de6aae700bbaf96401174e99))
* complete b0.7 admin domain di migration ([#43](https://github.com/dalssaso/mymemorycard/issues/43)) ([626b43e](https://github.com/dalssaso/mymemorycard/commit/626b43efded79ce67587951d5f0c76fa69454ede))
* complete b1 schema infrastructure for igdb migration ([#44](https://github.com/dalssaso/mymemorycard/issues/44)) ([c3f6be1](https://github.com/dalssaso/mymemorycard/commit/c3f6be12f08a708af7f6fe5b22d2959d45303ea6))
* implement B2 credentials feature ([#45](https://github.com/dalssaso/mymemorycard/issues/45)) ([e263c8a](https://github.com/dalssaso/mymemorycard/commit/e263c8a151d3e88eacb7fbc46a5f3c794a61a451))
* implement B3 IGDB integration service ([#46](https://github.com/dalssaso/mymemorycard/issues/46)) ([d4c6dca](https://github.com/dalssaso/mymemorycard/commit/d4c6dca72859cb4a74feb7a015f71d65880c0baf))
* implement B4 games domain with di architecture ([#47](https://github.com/dalssaso/mymemorycard/issues/47)) ([5f20ac8](https://github.com/dalssaso/mymemorycard/commit/5f20ac83758ba96a4c064734ac0632040e9bc132))
* implement B5 cleanup and legacy removal ([#51](https://github.com/dalssaso/mymemorycard/issues/51)) ([e2886bf](https://github.com/dalssaso/mymemorycard/commit/e2886bf28a4759ad150441482c21871c206e1cd0))
* implement B7 Steam and RetroAchievements integration ([#54](https://github.com/dalssaso/mymemorycard/issues/54)) ([1025c04](https://github.com/dalssaso/mymemorycard/commit/1025c045e5e6ece0e3012ba889fdccdd91dd95a5))
* rag integration with semantic search ([#28](https://github.com/dalssaso/mymemorycard/issues/28)) ([6a6ed5a](https://github.com/dalssaso/mymemorycard/commit/6a6ed5af09b01b32eeeff101a81224128246a2bd))


### Bug Fixes

* address credential validation, type safety, and IGDB ID propagation issues ([#52](https://github.com/dalssaso/mymemorycard/issues/52)) ([cfb2613](https://github.com/dalssaso/mymemorycard/commit/cfb2613af500bff7e6c965d54f1767e07c6a3665))
* standardize credentials validation response to use is_valid field ([#53](https://github.com/dalssaso/mymemorycard/issues/53)) ([4b006b9](https://github.com/dalssaso/mymemorycard/commit/4b006b988ee214a748ecfe184f266910e7ee1d12))


### Code Refactoring

* auth domain di migration ([#30](https://github.com/dalssaso/mymemorycard/issues/30)) ([d4eb273](https://github.com/dalssaso/mymemorycard/commit/d4eb2738ff22a915c29340264f0c28ed76a6ebf4))
* frontend and backend refactor for auth and api handlers using openai ([#37](https://github.com/dalssaso/mymemorycard/issues/37)) ([2dea782](https://github.com/dalssaso/mymemorycard/commit/2dea782a9007dfe0a6b48d0700bdb9f45267dcc0))
* migrate from openai sdk to vercel ai sdk ([#25](https://github.com/dalssaso/mymemorycard/issues/25)) ([bc62e1a](https://github.com/dalssaso/mymemorycard/commit/bc62e1aa8d65348b06c6687f62d1d1e30dcb41ad))
* platforms feature into DI ([#39](https://github.com/dalssaso/mymemorycard/issues/39)) ([7430602](https://github.com/dalssaso/mymemorycard/commit/7430602f4bfe986137e357d65c58acd15967c3e8))
* remove ai features from backend and apply test improvements ([#35](https://github.com/dalssaso/mymemorycard/issues/35)) ([42f1244](https://github.com/dalssaso/mymemorycard/commit/42f124412ef4fd42d263776e3945313c7866c2f7))

## [1.3.0](https://github.com/dalssaso/mymemorycard/compare/backend-v1.2.3...backend-v1.3.0) (2026-01-08)


### Features

* simplify ai providers to openai only ([#23](https://github.com/dalssaso/mymemorycard/issues/23)) ([a8cd2f4](https://github.com/dalssaso/mymemorycard/commit/a8cd2f45f80a18f94608ecf6a02c74bdb6516f90))


### Bug Fixes

* ai curator improvements ([#24](https://github.com/dalssaso/mymemorycard/issues/24)) ([e72e1ec](https://github.com/dalssaso/mymemorycard/commit/e72e1ec3feca1895ba7b6957079c71f660d4faae))
* invalidate collection cache when deleting games from library ([#22](https://github.com/dalssaso/mymemorycard/issues/22)) ([6a379da](https://github.com/dalssaso/mymemorycard/commit/6a379daff052220d41a5aced5e267ea791ce9524))
* use upsert for games and genres in franchise sync ([#15](https://github.com/dalssaso/mymemorycard/issues/15)) ([5568a48](https://github.com/dalssaso/mymemorycard/commit/5568a48fbf646504d3c14bb8e0337dc61e4875ca))

## [1.2.3](https://github.com/dalssaso/mymemorycard/compare/backend-v1.2.2...backend-v1.2.3) (2026-01-04)


### Bug Fixes

* google style formatting and linting fixes ([#12](https://github.com/dalssaso/mymemorycard/issues/12)) ([195cb60](https://github.com/dalssaso/mymemorycard/commit/195cb60e473472417af2a2b758e7eacd6186afca))

## [1.2.2](https://github.com/dalssaso/mymemorycard/compare/backend-v1.2.1...backend-v1.2.2) (2026-01-04)


### Bug Fixes

* problematic healthcheck and security code validation ([#10](https://github.com/dalssaso/mymemorycard/issues/10)) ([aae3d70](https://github.com/dalssaso/mymemorycard/commit/aae3d70c607cb80f6fbac5c82d703600e00555ee))

## [1.2.1](https://github.com/dalssaso/mymemorycard/compare/backend-v1.2.0...backend-v1.2.1) (2026-01-03)


### Bug Fixes

* copy drizzle migrations folder in Docker build ([#7](https://github.com/dalssaso/mymemorycard/issues/7)) ([6829ea0](https://github.com/dalssaso/mymemorycard/commit/6829ea03d9e1f0ee6a1970f1ecf4025182120746))

## [1.2.0](https://github.com/dalssaso/mymemorycard/compare/backend-v1.1.0...backend-v1.2.0) (2026-01-03)


### Features

* add Activity page and UX improvements ([6ef49a5](https://github.com/dalssaso/mymemorycard/commit/6ef49a5f43290b6eb39580c88ba08dde93450c14))
* add AI curator with library sorting ([358a69e](https://github.com/dalssaso/mymemorycard/commit/358a69e69ecd6ac0e65ab794503eacc06750a0fd))
* add AI image generation for collection covers ([53607ff](https://github.com/dalssaso/mymemorycard/commit/53607ff15c78b671c851411053a51a65d953386d))
* add collections and series support ([391483b](https://github.com/dalssaso/mymemorycard/commit/391483bab7c1886dc17fa5113f660b8f129b3c2c))
* add currently playing carousel and collapsible sidebars ([a3b8642](https://github.com/dalssaso/mymemorycard/commit/a3b86429b71fd38aa81214578f523f4fc261d30a))
* add dashboard with data visualizations ([24ae951](https://github.com/dalssaso/mymemorycard/commit/24ae951a9993b32363bf568042382fb3252b1cb1))
* add franchise support with bulk import ([b39ae06](https://github.com/dalssaso/mymemorycard/commit/b39ae0633c7bf15520c4209ae0c2375ed44e603c))
* add game detail page with metadata and styling ([2240e72](https://github.com/dalssaso/mymemorycard/commit/2240e7267da2d0543fbc6975d2b020e3203250cb))
* add global search and export functionality ([34d6c8d](https://github.com/dalssaso/mymemorycard/commit/34d6c8d3eede8a8f25f137f4fe8c754289899bb1))
* add mobile navigation and back buttons ([ae925b0](https://github.com/dalssaso/mymemorycard/commit/ae925b0a8cf9ce901fc853424df766773c5f3603))
* add platform management and onboarding flow ([4b19d74](https://github.com/dalssaso/mymemorycard/commit/4b19d74780bd74c317151d352b4e6d452ee88ffe))
* add playtime tracking with heatmaps and activity feed ([1f6efb8](https://github.com/dalssaso/mymemorycard/commit/1f6efb822664e2520ec5b0e2cf7d9bd8ebea2f26))
* add progress tracking and DLC ownership ([f3a8330](https://github.com/dalssaso/mymemorycard/commit/f3a8330b8201f2a969dae6dad4b0d75c8e9bef7c))
* add RAWG API integration and bulk import ([ad344c0](https://github.com/dalssaso/mymemorycard/commit/ad344c0a7e0d9a0c954da6c0e812b6c0dfb0e47c))
* add UI/UX infrastructure with toast and skeleton loading ([d7b9338](https://github.com/dalssaso/mymemorycard/commit/d7b9338699ded990e389f83dd6429133c390ac91))
* implement favorites and custom fields system ([05c4bbb](https://github.com/dalssaso/mymemorycard/commit/05c4bbbe6106cbdb987d54e0d2d144be8163cf0d))
* implement game library with TanStack Table ([94291c8](https://github.com/dalssaso/mymemorycard/commit/94291c804b18cdf69fe333e4b3f9f89948d33998))
* initial project foundation with authentication ([fd3ba9f](https://github.com/dalssaso/mymemorycard/commit/fd3ba9f6c3386b0965699d668f6973a1221d9b57))
* migrate to Catppuccin theme ([2ded117](https://github.com/dalssaso/mymemorycard/commit/2ded117d77350a82c01092c6e6732b9d26461a34))


### Bug Fixes

* various UI and UX improvements ([35ef5e7](https://github.com/dalssaso/mymemorycard/commit/35ef5e7ee1888f77e92af73f615db472eb3c1911))


### Code Refactoring

* migrate to Drizzle ORM and add achievements page ([a9d98d9](https://github.com/dalssaso/mymemorycard/commit/a9d98d914e8dd96ad3a60a7305fc7c1b610197e2))
* restructure tests and simplify development workflow ([7b92286](https://github.com/dalssaso/mymemorycard/commit/7b92286590a9c45651e0606efd90ba3eac794234))

## [1.1.0](https://github.com/dalssaso/mymemorycard/compare/backend-v1.0.0...backend-v1.1.0) (2026-01-03)


### Features

* add Activity page and UX improvements ([6ef49a5](https://github.com/dalssaso/mymemorycard/commit/6ef49a5f43290b6eb39580c88ba08dde93450c14))
* add AI curator with library sorting ([358a69e](https://github.com/dalssaso/mymemorycard/commit/358a69e69ecd6ac0e65ab794503eacc06750a0fd))
* add AI image generation for collection covers ([53607ff](https://github.com/dalssaso/mymemorycard/commit/53607ff15c78b671c851411053a51a65d953386d))
* add collections and series support ([391483b](https://github.com/dalssaso/mymemorycard/commit/391483bab7c1886dc17fa5113f660b8f129b3c2c))
* add currently playing carousel and collapsible sidebars ([a3b8642](https://github.com/dalssaso/mymemorycard/commit/a3b86429b71fd38aa81214578f523f4fc261d30a))
* add dashboard with data visualizations ([24ae951](https://github.com/dalssaso/mymemorycard/commit/24ae951a9993b32363bf568042382fb3252b1cb1))
* add franchise support with bulk import ([b39ae06](https://github.com/dalssaso/mymemorycard/commit/b39ae0633c7bf15520c4209ae0c2375ed44e603c))
* add game detail page with metadata and styling ([2240e72](https://github.com/dalssaso/mymemorycard/commit/2240e7267da2d0543fbc6975d2b020e3203250cb))
* add global search and export functionality ([34d6c8d](https://github.com/dalssaso/mymemorycard/commit/34d6c8d3eede8a8f25f137f4fe8c754289899bb1))
* add mobile navigation and back buttons ([ae925b0](https://github.com/dalssaso/mymemorycard/commit/ae925b0a8cf9ce901fc853424df766773c5f3603))
* add platform management and onboarding flow ([4b19d74](https://github.com/dalssaso/mymemorycard/commit/4b19d74780bd74c317151d352b4e6d452ee88ffe))
* add playtime tracking with heatmaps and activity feed ([1f6efb8](https://github.com/dalssaso/mymemorycard/commit/1f6efb822664e2520ec5b0e2cf7d9bd8ebea2f26))
* add progress tracking and DLC ownership ([f3a8330](https://github.com/dalssaso/mymemorycard/commit/f3a8330b8201f2a969dae6dad4b0d75c8e9bef7c))
* add RAWG API integration and bulk import ([ad344c0](https://github.com/dalssaso/mymemorycard/commit/ad344c0a7e0d9a0c954da6c0e812b6c0dfb0e47c))
* add UI/UX infrastructure with toast and skeleton loading ([d7b9338](https://github.com/dalssaso/mymemorycard/commit/d7b9338699ded990e389f83dd6429133c390ac91))
* implement favorites and custom fields system ([05c4bbb](https://github.com/dalssaso/mymemorycard/commit/05c4bbbe6106cbdb987d54e0d2d144be8163cf0d))
* implement game library with TanStack Table ([94291c8](https://github.com/dalssaso/mymemorycard/commit/94291c804b18cdf69fe333e4b3f9f89948d33998))
* initial project foundation with authentication ([fd3ba9f](https://github.com/dalssaso/mymemorycard/commit/fd3ba9f6c3386b0965699d668f6973a1221d9b57))
* migrate to Catppuccin theme ([2ded117](https://github.com/dalssaso/mymemorycard/commit/2ded117d77350a82c01092c6e6732b9d26461a34))


### Bug Fixes

* various UI and UX improvements ([35ef5e7](https://github.com/dalssaso/mymemorycard/commit/35ef5e7ee1888f77e92af73f615db472eb3c1911))


### Code Refactoring

* migrate to Drizzle ORM and add achievements page ([a9d98d9](https://github.com/dalssaso/mymemorycard/commit/a9d98d914e8dd96ad3a60a7305fc7c1b610197e2))
* restructure tests and simplify development workflow ([7b92286](https://github.com/dalssaso/mymemorycard/commit/7b92286590a9c45651e0606efd90ba3eac794234))
