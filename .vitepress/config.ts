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
      label: 'English',
      lang: 'en-US',
      description: 'Yumina AI Interactive Fiction Platform — Official Docs',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Basic Guide', link: '/guide/01-what-is-yumina' },
          { text: 'Vision', link: '/vision/' },
          { text: 'Creator Guide', link: '/creator-guide/00-welcome' },
          { text: 'Yumina', link: 'https://yumina.io' }
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Basic Guide',
              items: [
                { text: 'What is Yumina', link: '/guide/01-what-is-yumina' },
                { text: 'Register & Log In', link: '/guide/02-register-and-login' },
                { text: 'Explore Worlds', link: '/guide/03-explore-worlds' },
                { text: 'Start Playing', link: '/guide/04-start-playing' },
                { text: 'My Library', link: '/guide/05-my-library' },
                { text: 'Multiplayer Rooms', link: '/guide/06-multiplayer' },
                { text: 'Profile & Social', link: '/guide/07-profile-and-social' },
                { text: 'Settings', link: '/guide/08-settings' },
              ]
            }
          ],
          '/vision/': [
            {
              text: 'Vision',
              items: [
                { text: 'Open Source', link: '/vision/' },
              ]
            }
          ],
          '/creator-guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Welcome', link: '/creator-guide/00-welcome' },
                { text: "Beginner's Guide: Meet the Editor", link: '/creator-guide/01-beginner-guide' },
                { text: 'Tutorial: Build a Survival Horror World', link: '/creator-guide/02-tutorial-basic' },
                { text: 'Lazy Guide: Let AI Do It', link: '/creator-guide/02-tutorial-agent' },
                { text: 'Advanced: Battle Royale Game', link: '/creator-guide/02-tutorial-advanced' },
              ]
            },
            {
              text: 'Feature Reference',
              items: [
                { text: 'Entries & Lorebook', link: '/creator-guide/03-entries-and-lorebook' },
                { text: 'Variable System', link: '/creator-guide/04-variables' },
                { text: 'AI Directives & Macros', link: '/creator-guide/05-directives-and-macros' },
                { text: 'Rules Engine', link: '/creator-guide/06-rules-engine' },
                { text: 'Custom Frontend Guide', link: '/creator-guide/07-components' },
                { text: 'Custom Message Renderer', link: '/creator-guide/08-message-renderer' },
                { text: 'Audio System', link: '/creator-guide/09-audio' },
                { text: 'AI Models & Settings', link: '/creator-guide/10-ai-settings' },
                { text: 'Publish, Export & Bundle', link: '/creator-guide/11-publish-and-share' },
              ]
            },
            {
              text: 'Appendix',
              items: [
                { text: 'Core Concepts at a Glance', link: '/creator-guide/01-core-concepts' },
                { text: 'Glossary', link: '/creator-guide/12-glossary' },
                { text: 'FAQ', link: '/creator-guide/13-faq' },
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
    },

    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: 'Yumina 文档',
      description: 'Yumina AI 互动小说平台 — 官方文档',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '基础教程', link: '/zh/guide/01-what-is-yumina' },
          { text: '愿景', link: '/zh/vision/' },
          { text: '创作者指南', link: '/zh/creator-guide/00-welcome' },
          { text: 'Yumina', link: 'https://yumina.io' }
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '基础教程',
              items: [
                { text: '什么是 Yumina', link: '/zh/guide/01-what-is-yumina' },
                { text: '注册与登录', link: '/zh/guide/02-register-and-login' },
                { text: '探索世界', link: '/zh/guide/03-explore-worlds' },
                { text: '开始游戏', link: '/zh/guide/04-start-playing' },
                { text: '我的库', link: '/zh/guide/05-my-library' },
                { text: '多人房间', link: '/zh/guide/06-multiplayer' },
                { text: '个人主页与社交', link: '/zh/guide/07-profile-and-social' },
                { text: '设置', link: '/zh/guide/08-settings' },
              ]
            }
          ],
          '/zh/vision/': [
            {
              text: '愿景',
              items: [
                { text: '开源', link: '/zh/vision/' },
              ]
            }
          ],
          '/zh/creator-guide/': [
            {
              text: '入门',
              items: [
                { text: '欢迎', link: '/zh/creator-guide/00-welcome' },
                { text: '新手指南：认识编辑器', link: '/zh/creator-guide/01-beginner-guide' },
                { text: '教程：从零做一个生存恐怖世界', link: '/zh/creator-guide/02-tutorial-basic' },
                { text: '懒人教程：让 AI 帮你做', link: '/zh/creator-guide/02-tutorial-agent' },
                { text: '进阶教程：大逃杀游戏', link: '/zh/creator-guide/02-tutorial-advanced' },
              ]
            },
            {
              text: '功能参考',
              items: [
                { text: '词条与世界书', link: '/zh/creator-guide/03-entries-and-lorebook' },
                { text: '变量系统', link: '/zh/creator-guide/04-variables' },
                { text: 'AI 指令与宏', link: '/zh/creator-guide/05-directives-and-macros' },
                { text: '行为规则引擎', link: '/zh/creator-guide/06-rules-engine' },
                { text: '自定义前端指南', link: '/zh/creator-guide/07-components' },
                { text: '自定义消息渲染器', link: '/zh/creator-guide/08-message-renderer' },
                { text: '音频系统', link: '/zh/creator-guide/09-audio' },
                { text: 'AI 模型与设置', link: '/zh/creator-guide/10-ai-settings' },
                { text: '发布、导出与 Bundle', link: '/zh/creator-guide/11-publish-and-share' },
              ]
            },
            {
              text: '附录',
              items: [
                { text: '核心概念速览', link: '/zh/creator-guide/01-core-concepts' },
                { text: '术语表', link: '/zh/creator-guide/12-glossary' },
                { text: '常见问题', link: '/zh/creator-guide/13-faq' },
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
    }
  },

  themeConfig: {
    lastUpdated: false,
  }
})
