import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Yumina Docs',
  base: '/',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  sitemap: {
    hostname: 'https://docs.yumina.io',
  },

  appearance: false,
  ignoreDeadLinks: true,

  locales: {
    root: {
      label: '中文',
      lang: 'zh-CN',
      description: 'Yumina AI 互动小说平台 — 官方文档',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '基础教程', link: '/guide/01-what-is-yumina' },
          { text: '愿景', link: '/vision/' },
          { text: '创作者指南', link: '/creator-guide/00-welcome' },
          { text: 'Yumina', link: 'https://yumina.io' }
        ],
        sidebar: {
          '/guide/': [
            {
              text: '基础教程',
              items: [
                { text: '什么是 Yumina', link: '/guide/01-what-is-yumina' },
                { text: '注册与登录', link: '/guide/02-register-and-login' },
                { text: '探索世界', link: '/guide/03-explore-worlds' },
                { text: '开始游戏', link: '/guide/04-start-playing' },
                { text: '我的库', link: '/guide/05-my-library' },
                { text: '多人房间', link: '/guide/06-multiplayer' },
                { text: '个人主页与社交', link: '/guide/07-profile-and-social' },
                { text: '设置', link: '/guide/08-settings' },
              ]
            }
          ],
          '/vision/': [
            {
              text: '愿景',
              items: [
                { text: '开源', link: '/vision/' },
              ]
            }
          ],
          '/creator-guide/': [
            {
              text: '入门',
              items: [
                { text: '欢迎', link: '/creator-guide/00-welcome' },
                { text: '新手指南：认识编辑器', link: '/creator-guide/01-beginner-guide' },
                { text: '教程：从零做一个生存恐怖世界', link: '/creator-guide/02-tutorial-basic' },
                { text: '懒人教程：让 AI 帮你做', link: '/creator-guide/02-tutorial-agent' },
                { text: '进阶教程：大逃杀游戏', link: '/creator-guide/02-tutorial-advanced' },
              ]
            },
            {
              text: '功能参考',
              items: [
                { text: '词条与世界书', link: '/creator-guide/03-entries-and-lorebook' },
                { text: '变量系统', link: '/creator-guide/04-variables' },
                { text: 'AI 指令与宏', link: '/creator-guide/05-directives-and-macros' },
                { text: '行为规则引擎', link: '/creator-guide/06-rules-engine' },
                { text: '自定义前端指南', link: '/creator-guide/07-components' },
                { text: '自定义消息渲染器', link: '/creator-guide/08-message-renderer' },
                { text: '音频系统', link: '/creator-guide/09-audio' },
                { text: 'AI 模型与设置', link: '/creator-guide/10-ai-settings' },
                { text: '发布、导出与 Bundle', link: '/creator-guide/11-publish-and-share' },
              ]
            },
            {
              text: '附录',
              items: [
                { text: '核心概念速览', link: '/creator-guide/01-core-concepts' },
                { text: '术语表', link: '/creator-guide/12-glossary' },
                { text: '常见问题', link: '/creator-guide/13-faq' },
              ]
            }
          ]
        },
        outline: { label: '本页目录', level: [2, 3] },
        docFooter: { prev: '上一篇', next: '下一篇' },
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        search: {
          provider: 'local',
          options: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
              modal: {
                noResultsText: '没有找到相关结果',
                resetButtonTitle: '清除',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        }
      }
    },

    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      description: 'Yumina AI Interactive Fiction Platform — Official Docs',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Basic Guide', link: '/en/guide/01-what-is-yumina' },
          { text: 'Vision', link: '/en/vision/' },
          { text: 'Creator Guide', link: '/en/creator-guide/00-welcome' },
          { text: 'Yumina', link: 'https://yumina.io' }
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Basic Guide',
              items: [
                { text: 'What is Yumina', link: '/en/guide/01-what-is-yumina' },
                { text: 'Register & Log In', link: '/en/guide/02-register-and-login' },
                { text: 'Explore Worlds', link: '/en/guide/03-explore-worlds' },
                { text: 'Start Playing', link: '/en/guide/04-start-playing' },
                { text: 'My Library', link: '/en/guide/05-my-library' },
                { text: 'Multiplayer Rooms', link: '/en/guide/06-multiplayer' },
                { text: 'Profile & Social', link: '/en/guide/07-profile-and-social' },
                { text: 'Settings', link: '/en/guide/08-settings' },
              ]
            }
          ],
          '/en/vision/': [
            {
              text: 'Vision',
              items: [
                { text: 'Open Source', link: '/en/vision/' },
              ]
            }
          ],
          '/en/creator-guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Welcome', link: '/en/creator-guide/00-welcome' },
                { text: "Beginner's Guide: Meet the Editor", link: '/en/creator-guide/01-beginner-guide' },
                { text: 'Tutorial: Build a Survival Horror World', link: '/en/creator-guide/02-tutorial-basic' },
                { text: 'Lazy Guide: Let AI Do It', link: '/en/creator-guide/02-tutorial-agent' },
                { text: 'Advanced: Battle Royale Game', link: '/en/creator-guide/02-tutorial-advanced' },
              ]
            },
            {
              text: 'Feature Reference',
              items: [
                { text: 'Entries & Lorebook', link: '/en/creator-guide/03-entries-and-lorebook' },
                { text: 'Variable System', link: '/en/creator-guide/04-variables' },
                { text: 'AI Directives & Macros', link: '/en/creator-guide/05-directives-and-macros' },
                { text: 'Rules Engine', link: '/en/creator-guide/06-rules-engine' },
                { text: 'Custom Frontend Guide', link: '/en/creator-guide/07-components' },
                { text: 'Custom Message Renderer', link: '/en/creator-guide/08-message-renderer' },
                { text: 'Audio System', link: '/en/creator-guide/09-audio' },
                { text: 'AI Models & Settings', link: '/en/creator-guide/10-ai-settings' },
                { text: 'Publish, Export & Bundle', link: '/en/creator-guide/11-publish-and-share' },
              ]
            },
            {
              text: 'Appendix',
              items: [
                { text: 'Core Concepts at a Glance', link: '/en/creator-guide/01-core-concepts' },
                { text: 'Glossary', link: '/en/creator-guide/12-glossary' },
                { text: 'FAQ', link: '/en/creator-guide/13-faq' },
              ]
            }
          ]
        },
        outline: { label: 'On This Page', level: [2, 3] },
        docFooter: { prev: 'Previous', next: 'Next' },
        returnToTopLabel: 'Back to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Theme',
        search: {
          provider: 'local',
        }
      }
    }
  },

  themeConfig: {
    lastUpdated: false,
  }
})
