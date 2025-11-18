/**
 * Landing Page Initialization Script
 * Main entry point for landing page functionality
 */

import { Navigation } from '../components/navigation.js';
import { LoginButton } from '../components/login-button.js';
import { HeroSection } from '../components/hero-section.js';
import { ScrollAnimations } from '../components/scroll-animations.js';
import { MovingObjects } from '../components/moving-objects.js';
import { animationController } from '../services/animation-controller.js';
import { parallaxController } from '../services/parallax-controller.js';
import { performanceMonitor } from '../services/performance-monitor.js';
import { ContentSection } from '../components/content-section.js';
import { PartnersSection } from '../components/partners-section.js';
import { ContactsSection } from '../components/contacts-section.js';
import { ContactForm } from '../components/contact-form.js';
import { SectionsNavigation } from '../components/sections-navigation.js';
import { getCurrentLanguage, t, getSection } from '../services/i18n.js';

/**
 * Landing page content configuration
 * Contains data for all content sections (About, Services, Customers, Partners, Contacts)
 */
export const landingPageContent = {
  about: {
    id: 'about-company',
    type: 'about',
    title: 'About Company',
    subtitle: 'Building enterprise and SME server solutions since 2015',
    content: {
      background: 'We are a specialized provider of comprehensive server solutions, dedicated to empowering enterprises and small-to-medium businesses with robust, scalable, and reliable infrastructure. Our expertise spans from custom server deployments and cloud migrations to ongoing maintenance and 24/7 monitoring. With over 15 years of industry experience, we understand the unique challenges that businesses face when building and managing their IT infrastructure, and we deliver tailored solutions that drive efficiency, security, and growth.',
      mission: 'Our mission is to deliver world-class server solutions that enable enterprises and SMEs to achieve their business objectives through reliable, scalable, and cost-effective infrastructure. We combine deep technical expertise with a customer-centric approach, ensuring that every deployment is optimized for performance, security, and long-term success. We believe that every business, regardless of size, deserves enterprise-grade server infrastructure that supports their growth and digital transformation journey.',
      values: [
        'Reliability & Uptime Excellence',
        'Security-First Approach',
        'Scalability & Future-Proofing',
        'Enterprise & SME Expertise',
        '24/7 Proactive Support',
        'Innovation & Best Practices'
      ],
      history: 'Founded in 2015, we began as a boutique server solutions provider focused on helping small and medium businesses achieve enterprise-level infrastructure capabilities. Over the years, we\'ve expanded our services to serve Fortune 500 companies while maintaining our commitment to personalized service for SMEs. Today, we manage server infrastructure for over 800 organizations across various industries, handling millions of requests daily and maintaining an industry-leading 99.99% uptime record. Our team of certified engineers and architects brings decades of combined experience in server architecture, cloud platforms, virtualization, and cybersecurity.'
    },
    backgroundColor: 'var(--bg-secondary)',
    textColor: 'var(--text-primary)'
  },
  services: {
    id: 'services',
    type: 'services',
    title: 'Our Services',
    subtitle: 'Comprehensive server solutions for enterprise and SME',
    content: {
      services: [
        {
          id: 'server-deployment',
          title: 'Custom Server Deployment',
          description: 'End-to-end server deployment from needs diagnostics to performance optimization. We ensure your servers are optimized for performance, security, and scalability.',
          icon: '🖥️',
          features: [
            'Technical task development',
            'Equipment selection & delivery',
            'OS installation & configuration',
            'Network setup & security hardening',
            'Performance optimization',
            'Documentation & handover'
          ]
        },
        {
          id: 'ai-infrastructure',
          title: 'AI Model Infrastructure',
          description: 'Building and configuring infrastructure for training and deploying machine learning and AI models. Optimizing computational resources for high-load AI tasks.',
          icon: '🤖',
          features: [
            'AI infrastructure design',
            'GPU cluster setup',
            'Model training environment',
            'Scalable deployment solutions',
            'Performance optimization for AI workloads'
          ]
        },
        {
          id: 'cloud-migration',
          title: 'Cloud Migration & Hybrid Solutions',
          description: 'Seamlessly migrate your server infrastructure to the cloud or deploy hybrid solutions that combine on-premise and cloud resources. We minimize downtime and ensure data integrity throughout the migration process.',
          icon: '☁️',
          features: [
            'Cloud platform assessment',
            'Migration planning & execution',
            'Hybrid infrastructure design',
            'Cost optimization strategies',
            'Post-migration support'
          ]
        },
        {
          id: 'infrastructure-management',
          title: 'Infrastructure Management',
          description: 'Comprehensive server management services that ensure your infrastructure remains secure, optimized, and aligned with your business goals. From routine maintenance to strategic upgrades, we handle it all.',
          icon: '⚙️',
          features: [
            'Proactive monitoring & alerting',
            'Security patches & updates',
            'Capacity planning',
            'Performance tuning',
            'Backup & disaster recovery'
          ]
        },
        {
          id: 'support',
          title: '24/7 Technical Support',
          description: 'Round-the-clock monitoring and support from our team of certified engineers. Get rapid response times, proactive issue resolution, and expert guidance whenever you need it, day or night.',
          icon: '🛡️',
          features: [
            'Service package',
            '24/7/365 availability',
            'Average 5-minute response time',
            'Certified engineers on-call',
            'Remote diagnostics & resolution',
            'Priority escalation paths'
          ]
        },
        {
          id: 'virtualization',
          title: 'Server Virtualization & Consolidation',
          description: 'Maximize your server resources through advanced virtualization technologies. Reduce hardware costs, improve efficiency, and simplify management while maintaining high performance and availability.',
          icon: '🔄',
          features: [
            'VMware, Hyper-V, KVM expertise',
            'Resource optimization',
            'High availability clustering',
            'VM backup & replication',
            'Capacity planning'
          ]
        },
        {
          id: 'security',
          title: 'Information Security',
          description: 'Protect your critical infrastructure with comprehensive security services. From initial hardening to ongoing threat monitoring, we ensure your servers meet the highest security standards.',
          icon: '🔒',
          features: [
            'Security assessment & auditing',
            'Firewall configuration',
            'Intrusion detection & prevention',
            'Compliance (ISO, SOC2, GDPR)',
            'Security incident response'
          ]
        },
        {
          id: 'backup-disaster',
          title: 'Backup & Disaster Recovery',
          description: 'Protect your business with robust backup and disaster recovery solutions. Ensure business continuity with automated backups, tested recovery procedures, and rapid restoration capabilities.',
          icon: '💾',
          features: [
            'Automated backup scheduling',
            'Off-site backup storage',
            'Recovery time objective (RTO) planning',
            'Regular disaster recovery testing',
            'Point-in-time recovery options'
          ]
        },
        {
          id: 'consulting',
          title: 'Server Architecture Consulting',
          description: 'Strategic guidance for designing, optimizing, and scaling your server infrastructure. Our architects help you make informed decisions that align with your business objectives and budget.',
          icon: '📊',
          features: [
            'Infrastructure assessment',
            'Architecture design & planning',
            'Technology stack recommendations',
            'Cost-benefit analysis',
            'Roadmap development'
          ]
        }
      ]
    },
    backgroundColor: 'var(--bg-primary)',
    textColor: 'var(--text-primary)'
  },
  customers: {
    id: 'customers',
    type: 'partners',
    title: 'Наши клиенты',
    subtitle: 'Организации, которые доверяют нам свои IT-решения',
    partners: [
      {
        id: 'customer-medical-college',
        name: 'Свердловский областной медицинский колледж',
        logo: '/assets/logos/customers/sverdlovsk-medical-college.jpg',
        description: 'Образовательное учреждение',
        website: '',
        category: 'Образование'
      },
      {
        id: 'customer-volgospas',
        name: 'ВОЛГОСПАС',
        logo: '/assets/logos/customers/volgospas.webp',
        description: 'Астраханская область - Служба спасения',
        website: '',
        category: 'Госслужба'
      },
      {
        id: 'customer-kalugainformtech',
        name: 'КАЛУГАИНФОРМТЕХ',
        logo: '/assets/logos/customers/kalugainformtech.png',
        description: 'Информационные технологии',
        website: '',
        category: 'IT'
      },
      {
        id: 'customer-kemgik',
        name: 'КЕМГИК',
        logo: '/assets/logos/customers/kemgik.jpg',
        description: 'Кемеровский государственный институт культуры',
        website: '',
        category: 'Образование'
      },
      {
        id: 'customer-chukotenergo',
        name: 'Чукотэнерго',
        logo: '/assets/logos/customers/chukotenergo.png',
        description: 'Энергетическая компания',
        website: '',
        category: 'Энергетика'
      },
      {
        id: 'customer-tattelcom',
        name: 'ТАТТЕЛЕКОМ',
        logo: '/assets/logos/customers/tattelcom.png',
        description: 'Телекоммуникационная компания',
        website: '',
        category: 'Телеком'
      },
      {
        id: 'customer-bank-chbrr',
        name: 'БАНК ЧБРР',
        logo: '/assets/logos/customers/bank-chbrr.jpg',
        description: 'Банк',
        website: '',
        category: 'Финансы'
      },
      {
        id: 'customer-el-telkom',
        name: 'Эл Телком',
        logo: '/assets/logos/customers/el-telkom.jpg',
        description: 'Телекоммуникационная компания',
        website: '',
        category: 'Телеком'
      },
      {
        id: 'customer-gcrp',
        name: 'ГЦРП',
        logo: '/assets/logos/customers/gcrp.jpeg',
        description: 'Городской центр развития предпринимательства',
        website: '',
        category: 'Бизнес'
      },
      {
        id: 'customer-rosalkogol',
        name: 'Федеральная служба по контролю за алкогольным и табачным рынками',
        logo: '/assets/logos/customers/rosalkogol.png',
        description: 'Федеральная служба',
        website: '',
        category: 'Госслужба'
      },
      {
        id: 'customer-rosseti',
        name: 'РОССЕТИ НОВОСИБИРСК',
        logo: '/assets/logos/customers/rosseti-novosibirsk.png',
        description: 'Энергетическая компания',
        website: '',
        category: 'Энергетика'
      },
      {
        id: 'customer-social-fund',
        name: 'Социальный фонд России',
        logo: '/assets/logos/customers/social-fund-russia.jpg',
        description: 'Социальный фонд',
        website: '',
        category: 'Госслужба'
      },
      {
        id: 'customer-ges',
        name: 'ГЭС',
        logo: '/assets/logos/customers/ges.jpg',
        description: 'Энергия строит',
        website: '',
        category: 'Энергетика'
      },
      {
        id: 'customer-kraigaz',
        name: 'КРАЙГАЗ',
        logo: '/assets/logos/customers/kraigaz.png',
        description: 'Красноярск - Газовая компания',
        website: '',
        category: 'Энергетика'
      },
      {
        id: 'customer-aprel',
        name: 'АПРЕЛЬ',
        logo: '/assets/logos/customers/aprel.png',
        description: 'Сеть аптек',
        website: '',
        category: 'Фармацевтика'
      },
      {
        id: 'customer-yugorsky-holding',
        name: 'Югорский лесопромышленный холдинг',
        logo: '/assets/logos/customers/yugorsky-holding.png',
        description: 'Лесопромышленный холдинг',
        website: '',
        category: 'Промышленность'
      },
      {
        id: 'customer-mental-health',
        name: 'Научный центр психического здоровья',
        logo: '/assets/logos/customers/mental-health.jpg',
        description: 'Федеральное государственное бюджетное научное учреждение',
        website: '',
        category: 'Здравоохранение'
      }
    ],
    backgroundColor: 'var(--bg-primary)',
    textColor: 'var(--text-primary)'
  },
  partners: {
    id: 'partners',
    type: 'partners',
    title: 'Our Partners',
    subtitle: 'Certified partnerships with industry-leading technology providers',
    partners: [
      {
        id: 'partner-intel',
        name: 'Intel',
        logo: '/assets/logos/intel.png',
        description: 'Technology Partner - Processors',
        website: 'https://www.intel.com',
        category: 'Hardware'
      },
      {
        id: 'partner-amd',
        name: 'AMD',
        logo: '/assets/logos/amd.png',
        description: 'Technology Partner - Processors & Accelerators',
        website: 'https://www.amd.com',
        category: 'Hardware'
      },
      {
        id: 'partner-hp',
        name: 'HP Enterprise',
        logo: '/assets/logos/hp.png',
        description: 'Gold Partner - Enterprise Servers',
        website: 'https://www.hpe.com',
        category: 'Hardware'
      },
      {
        id: 'partner-dell',
        name: 'Dell Technologies',
        logo: '/assets/logos/dell.png',
        description: 'Certified Partner - Server Hardware',
        website: 'https://www.dell.com',
        category: 'Hardware'
      },
      {
        id: 'partner-lenovo',
        name: 'Lenovo',
        logo: '/assets/logos/lenovo.png',
        description: 'Certified Partner - Enterprise Solutions',
        website: 'https://www.lenovo.com',
        category: 'Hardware'
      },
      {
        id: 'partner-asus',
        name: 'ASUS',
        logo: '/assets/logos/asus.svg',
        description: 'Technology Partner',
        website: 'https://www.asus.com',
        category: 'Hardware'
      },
      {
        id: 'partner-supermicro',
        name: 'Supermicro',
        logo: '/assets/logos/supermicro.svg',
        description: 'Technology Partner',
        website: 'https://www.supermicro.com',
        category: 'Hardware'
      },
      {
        id: 'partner-huawei',
        name: 'Huawei',
        logo: '/assets/logos/huawei.svg',
        description: 'Technology Partner',
        website: 'https://www.huawei.com',
        category: 'Hardware'
      },
      {
        id: 'partner-apex',
        name: 'Apex',
        logo: '/assets/logos/apex.svg',
        description: 'Technology Partner',
        website: '',
        category: 'Hardware'
      },
      {
        id: 'partner-gooxi',
        name: 'Gooxi',
        logo: '/assets/logos/gooxi.svg',
        description: 'Technology Partner',
        website: '',
        category: 'Hardware'
      },
      {
        id: 'partner-ricor',
        name: 'Ricor',
        logo: '/assets/logos/ricor.svg',
        description: 'Technology Partner',
        website: '',
        category: 'Hardware'
      },
      {
        id: 'partner-hepna',
        name: 'Hepna',
        logo: '/assets/logos/hepna.svg',
        description: 'Technology Partner',
        website: '',
        category: 'Hardware'
      },
      {
        id: 'partner-graviton',
        name: 'Graviton',
        logo: '/assets/logos/graviton.svg',
        description: 'Technology Partner',
        website: '',
        category: 'Hardware'
      },
      {
        id: 'partner-amagerys',
        name: 'Amagerys',
        logo: '/assets/logos/amagerys.svg',
        description: 'Technology Partner',
        website: '',
        category: 'Hardware'
      },
      {
        id: 'partner-sir',
        name: 'SIR',
        logo: '/assets/logos/sir.svg',
        description: 'Technology Partner',
        website: '',
        category: 'Hardware'
      },
      {
        id: 'partner-hynix',
        name: 'SK Hynix',
        logo: '/assets/logos/hynix.svg',
        description: 'Technology Partner - Memory',
        website: 'https://www.skhynix.com',
        category: 'Hardware'
      },
      {
        id: 'partner-micron',
        name: 'Micron',
        logo: '/assets/logos/micron.svg',
        description: 'Technology Partner - Memory',
        website: 'https://www.micron.com',
        category: 'Hardware'
      },
      {
        id: 'partner-samsung',
        name: 'Samsung',
        logo: '/assets/logos/samsung.svg',
        description: 'Technology Partner - Memory',
        website: 'https://www.samsung.com',
        category: 'Hardware'
      },
      {
        id: 'partner-kingston',
        name: 'Kingston',
        logo: '/assets/logos/kingston.svg',
        description: 'Technology Partner - Memory',
        website: 'https://www.kingston.com',
        category: 'Hardware'
      },
      {
        id: 'partner-toshiba',
        name: 'Toshiba',
        logo: '/assets/logos/toshiba.svg',
        description: 'Technology Partner - Storage',
        website: 'https://www.toshiba.com',
        category: 'Hardware'
      },
      {
        id: 'partner-nvidia',
        name: 'NVIDIA',
        logo: '/assets/logos/nvidia.svg',
        description: 'Technology Partner - GPUs',
        website: 'https://www.nvidia.com',
        category: 'Hardware'
      },
      {
        id: 'partner-gigabyte',
        name: 'Gigabyte',
        logo: '/assets/logos/gigabyte.svg',
        description: 'Technology Partner',
        website: 'https://www.gigabyte.com',
        category: 'Hardware'
      },
      {
        id: 'partner-lsi',
        name: 'LSI',
        logo: '/assets/logos/lsi.svg',
        description: 'Technology Partner',
        website: '',
        category: 'Hardware'
      },
      {
        id: 'partner-mellanox',
        name: 'Mellanox',
        logo: '/assets/logos/mellanox.svg',
        description: 'Technology Partner - Networking',
        website: 'https://www.nvidia.com/en-us/networking/ethernet/',
        category: 'Networking'
      },
      {
        id: 'partner-broadcom',
        name: 'Broadcom',
        logo: '/assets/logos/broadcom.svg',
        description: 'Technology Partner',
        website: 'https://www.broadcom.com',
        category: 'Hardware'
      }
    ],
    backgroundColor: 'var(--bg-primary)',
    textColor: 'var(--text-primary)'
  },
  contacts: {
    id: 'contacts',
    type: 'contacts',
    title: 'Contact Us',
    subtitle: 'Get in touch with our server solutions team',
    contactInfo: {
      address: {
        street: 'ул. Мичурина, д. 15',
        city: 'Новосибирск',
        state: '',
        zip: '630091',
        country: 'Россия'
      },
      phone: '',
      email: 'info@sib-server.ru',
      officeHours: 'Понедельник-пятница 6:00 - 18:00 МСК | Круглосуточная экстренная поддержка'
    },
    form: {
      id: 'contact-form',
      endpoint: '/api/contact',
      fields: {
        name: { required: true, maxLength: 100 },
        email: { required: true, maxLength: 255 },
        phone: { required: false, maxLength: 20 },
        message: { required: true, maxLength: 5000 }
      }
    },
    backgroundColor: 'var(--bg-secondary)',
    textColor: 'var(--text-primary)'
  }
};

// Initialize landing page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initLandingPage();
});

/**
 * Initialize landing page components
 */
function initLandingPage() {
  // Initialize navigation
  const navContainer = document.querySelector('#navigation');
  let navigation = null;
  if (navContainer) {
    navigation = new Navigation();
    const navElement = navigation.render(navContainer);

    // Initialize login button
    const loginContainer = navigation.getLoginButtonContainer();
    if (loginContainer) {
      const loginButton = new LoginButton({
        text: t('nav.login'),
        href: '/src/pages/login.html',
        ariaLabel: 'Navigate to login page'
      });
      loginButton.render(loginContainer);
      window.loginButtonInstance = loginButton; // Store for language updates
    }
  }

  // Initialize hero section with 3D scene
  const heroContainer = document.querySelector('#hero');
  if (heroContainer) {
    const heroSection = new HeroSection();
    heroSection.init(heroContainer);
    
    // Update hero text with translations
    const heroTitle = heroContainer.querySelector('.hero-headline');
    const heroSubtitle = heroContainer.querySelector('.hero-subheadline');
    if (heroTitle) heroTitle.textContent = t('hero.title');
    if (heroSubtitle) heroSubtitle.textContent = t('hero.subtitle');
  }
  
  // Update footer
  const footerText = document.querySelector('#footer .footer-content p');
  if (footerText) {
    footerText.textContent = t('footer.copyright');
  }

  // Initialize content sections first (before animations)
  initializeContentSections();

  // Store navigation instance for language updates (before setting up listeners)
  if (navContainer && navigation) {
    window.navigationInstance = navigation;
  }

  // Initialize sections navigation
  const sectionsNav = new SectionsNavigation({
    sections: [
      { id: 'hero', label: t('nav.home') },
      { id: 'about-company', label: t('nav.about') },
      { id: 'services', label: t('nav.services') },
      { id: 'partners', label: t('nav.partners') },
      { id: 'contacts', label: t('nav.contact') }
    ],
    position: 'right'
  });
  sectionsNav.render(document.body);
  window.sectionsNavigationInstance = sectionsNav;

  // Setup language change listener to update content
  window.addEventListener('languagechange', () => {
    updateLanguageContent();
    // Update navigation logo text
    if (window.navigationInstance) {
      window.navigationInstance.update();
    }
  });

  // Initialize scroll animations after sections are created
  const scrollAnimations = new ScrollAnimations();
  scrollAnimations.init();
  // Store reference for potential refresh
  window.scrollAnimationsInstance = scrollAnimations;

  // Initialize moving objects in content sections (if containers exist)
  const contentSections = document.querySelectorAll('.content-section, section[data-moving-objects]');
  contentSections.forEach((section, index) => {
    if (animationController.shouldAnimate()) {
      const movingObjects = new MovingObjects(section, {
        motionType: index % 2 === 0 ? 'float' : 'orbit',
        speed: 0.5 + (index % 3) * 0.2,
        range: { x: 10, y: 15, z: 0 }
      });
      // Store reference for cleanup if needed
      section._movingObjects = movingObjects;
    }
  });

  // Initialize parallax effects for background elements
  const parallaxElements = document.querySelectorAll('[data-parallax-speed]');
  parallaxElements.forEach(element => {
    const speed = parseFloat(element.dataset.parallaxSpeed) || 0.2;
    parallaxController.registerElement(element, { speed });
  });

  // Start performance monitoring
  performanceMonitor.start();
  
  // Link performance monitor with animation controller for adaptive quality
  performanceMonitor.onFPSUpdate((fps, averageFps) => {
    const qualityLevel = performanceMonitor.detectAdaptiveQuality();
    const currentLevel = animationController.getPerformanceLevel();
    
    if (qualityLevel !== currentLevel) {
      animationController.setPerformanceLevel(qualityLevel);
    }
  });

  // Check animation preferences
  const animationState = animationController.getAnimationState();
  if (!animationState.shouldAnimate) {
    // Disable animations if user prefers reduced motion
    document.documentElement.classList.add('reduced-motion');
  }

  console.log('Landing page initialized with enhanced animations');
}

/**
 * Get translated landing page content
 */
function getLandingPageContent() {
  const lang = getCurrentLanguage();
  const services = getSection('services', lang);
  const about = getSection('about', lang);
  const customers = getSection('customers', lang);
  const partners = getSection('partners', lang);
  const contacts = getSection('contacts', lang);

  return {
    about: {
      id: 'about-company',
      type: 'about',
      title: about.title || t('about.title'),
      subtitle: about.subtitle || t('about.subtitle'),
      content: {
        background: about.background || t('about.background'),
        mission: about.mission || t('about.mission'),
        missionTitle: about.missionTitle || t('about.missionTitle'),
        valuesTitle: about.valuesTitle || t('about.valuesTitle'),
        historyTitle: about.historyTitle || t('about.historyTitle'),
        history: about.history || t('about.history'),
        values: about.values || (lang === 'ru' ? getSection('about', 'ru').values : getSection('about', 'en').values)
      },
      backgroundColor: 'var(--bg-secondary)',
      textColor: 'var(--text-primary)'
    },
    services: {
      id: 'services',
      type: 'services',
      title: services.title || t('services.title'),
      subtitle: services.subtitle || t('services.subtitle'),
      content: {
        services: [
          {
            id: 'server-deployment',
            title: services.serverDeployment?.title || t('services.serverDeployment.title'),
            description: services.serverDeployment?.description || t('services.serverDeployment.description'),
            icon: '🖥️',
            features: lang === 'ru' ? [
              'Разработка технического задания',
              'Подбор и поставка оборудования',
              'Установка и настройка ОС',
              'Настройка сети и безопасность',
              'Оптимизация производительности',
              'Документация и передача'
            ] : [
              'Technical task development',
              'Equipment selection & delivery',
              'OS installation & configuration',
              'Network setup & security hardening',
              'Performance optimization',
              'Documentation & handover'
            ]
          },
          {
            id: 'ai-infrastructure',
            title: services.aiInfrastructure?.title || t('services.aiInfrastructure.title'),
            description: services.aiInfrastructure?.description || t('services.aiInfrastructure.description'),
            icon: '🤖',
            features: lang === 'ru' ? [
              'Проектирование AI-инфраструктуры',
              'Настройка GPU-кластеров',
              'Среда для обучения моделей',
              'Масштабируемые решения для развертывания',
              'Оптимизация производительности для AI-задач'
            ] : [
              'AI infrastructure design',
              'GPU cluster setup',
              'Model training environment',
              'Scalable deployment solutions',
              'Performance optimization for AI workloads'
            ]
          },
          {
            id: 'cloud-migration',
            title: services.cloudMigration?.title || t('services.cloudMigration.title'),
            description: services.cloudMigration?.description || t('services.cloudMigration.description'),
            icon: '☁️',
            features: lang === 'ru' ? [
              'Оценка облачных платформ',
              'Планирование и выполнение миграции',
              'Дизайн гибридной инфраструктуры',
              'Стратегии оптимизации затрат',
              'Поддержка после миграции'
            ] : [
              'Cloud platform assessment',
              'Migration planning & execution',
              'Hybrid infrastructure design',
              'Cost optimization strategies',
              'Post-migration support'
            ]
          },
          {
            id: 'infrastructure-management',
            title: services.infrastructureManagement?.title || t('services.infrastructureManagement.title'),
            description: services.infrastructureManagement?.description || t('services.infrastructureManagement.description'),
            icon: '⚙️',
            features: lang === 'ru' ? [
              'Проактивный мониторинг',
              'Обновления безопасности',
              'Планирование мощностей',
              'Настройка производительности',
              'Резервное копирование'
            ] : [
              'Proactive monitoring & alerting',
              'Security patches & updates',
              'Capacity planning',
              'Performance tuning',
              'Backup & disaster recovery'
            ]
          },
          {
            id: 'security',
            title: services.security?.title || t('services.security.title'),
            description: services.security?.description || t('services.security.description'),
            icon: '🔒',
            features: lang === 'ru' ? [
              'Оценка и аудит безопасности',
              'Настройка файрвола',
              'Обнаружение и предотвращение вторжений',
              'Соответствие стандартам',
              'Реагирование на инциденты'
            ] : [
              'Security assessment & auditing',
              'Firewall configuration',
              'Intrusion detection & prevention',
              'Compliance (ISO, SOC2, GDPR)',
              'Security incident response'
            ]
          },
          {
            id: 'backup-disaster',
            title: services.backupDisaster?.title || t('services.backupDisaster.title'),
            description: services.backupDisaster?.description || t('services.backupDisaster.description'),
            icon: '💾',
            features: lang === 'ru' ? [
              'Автоматическое резервное копирование',
              'Хранение резервных копий вне площадки',
              'Планирование RTO',
              'Тестирование восстановления',
              'Восстановление на момент времени'
            ] : [
              'Automated backup scheduling',
              'Off-site backup storage',
              'Recovery time objective (RTO) planning',
              'Regular disaster recovery testing',
              'Point-in-time recovery options'
            ]
          },
          {
            id: 'virtualization',
            title: services.virtualization?.title || t('services.virtualization.title'),
            description: services.virtualization?.description || t('services.virtualization.description'),
            icon: '🔄',
            features: lang === 'ru' ? [
              'Экспертиза VMware, Hyper-V, KVM',
              'Оптимизация ресурсов',
              'Кластеризация высокой доступности',
              'Резервное копирование ВМ',
              'Планирование мощностей'
            ] : [
              'VMware, Hyper-V, KVM expertise',
              'Resource optimization',
              'High availability clustering',
              'VM backup & replication',
              'Capacity planning'
            ]
          },
          {
            id: 'support',
            title: services.support?.title || t('services.support.title'),
            description: services.support?.description || t('services.support.description'),
            icon: '🛡️',
            features: lang === 'ru' ? [
              'Сервисный пакет',
              'Доступность 24/7/365',
              'Среднее время отклика 5 минут',
              'Сертифицированные инженеры',
              'Диагностика и решение',
              'Приоритетные эскалации'
            ] : [
              'Service package',
              '24/7/365 availability',
              'Average 5-minute response time',
              'Certified engineers on-call',
              'Remote diagnostics & resolution',
              'Priority escalation paths'
            ]
          },
          {
            id: 'consulting',
            title: services.consulting?.title || t('services.consulting.title'),
            description: services.consulting?.description || t('services.consulting.description'),
            icon: '📊',
            features: lang === 'ru' ? [
              'Оценка инфраструктуры',
              'Проектирование архитектуры',
              'Рекомендации по технологиям',
              'Анализ затрат и выгод',
              'Разработка плана'
            ] : [
              'Infrastructure assessment',
              'Architecture design & planning',
              'Technology stack recommendations',
              'Cost-benefit analysis',
              'Roadmap development'
            ]
          }
        ]
      },
      backgroundColor: 'var(--bg-primary)',
      textColor: 'var(--text-primary)'
    },
    customers: {
      id: 'customers',
      type: 'partners',
      title: customers.title || t('customers.title'),
      subtitle: customers.subtitle || t('customers.subtitle'),
      partners: landingPageContent.customers.partners,
      backgroundColor: 'var(--bg-primary)',
      textColor: 'var(--text-primary)'
    },
    partners: {
      id: 'partners',
      type: 'partners',
      title: partners.title || t('partners.title'),
      subtitle: partners.subtitle || t('partners.subtitle'),
      partners: landingPageContent.partners.partners, // Keep partners as-is
      backgroundColor: 'var(--bg-primary)',
      textColor: 'var(--text-primary)'
    },
    contacts: {
      id: 'contacts',
      type: 'contacts',
      title: contacts.title || t('contacts.title'),
      subtitle: contacts.subtitle || t('contacts.subtitle'),
      contactInfo: {
        address: landingPageContent.contacts.contactInfo.address,
        phone: landingPageContent.contacts.contactInfo.phone,
        email: landingPageContent.contacts.contactInfo.email,
        officeHours: contacts.officeHours || t('contacts.officeHours')
      },
      form: {
        id: 'contact-form',
        endpoint: '/api/contact',
        fields: landingPageContent.contacts.form.fields
      },
      backgroundColor: 'var(--bg-secondary)',
      textColor: 'var(--text-primary)'
    }
  };
}

/**
 * Initialize content sections
 */
function initializeContentSections() {
  const mainContent = document.querySelector('#main-content');
  if (!mainContent) return;

  const content = getLandingPageContent();

  // Initialize About Company section
  let aboutSection = document.querySelector('#about-company');
  if (content.about) {
    const about = new ContentSection(content.about);
    about.create();
    if (about.sectionElement) {
      if (aboutSection) {
        // Replace existing empty section with populated content
        aboutSection.replaceWith(about.sectionElement);
      } else {
        // Append new section if it doesn't exist
        mainContent.appendChild(about.sectionElement);
      }
    }
  }

  // Initialize Services section
  let servicesSection = document.querySelector('#services');
  if (content.services) {
    const services = new ContentSection(content.services);
    services.create();
    if (services.sectionElement) {
      if (servicesSection) {
        servicesSection.replaceWith(services.sectionElement);
      } else {
        mainContent.appendChild(services.sectionElement);
      }
    }
  }

  // Initialize Customers section
  let customersSection = document.querySelector('#customers');
  if (content.customers) {
    const customers = new PartnersSection(content.customers);
    if (customersSection) {
      // Replace existing section with new one using render method
      customers.create();
      if (customers.sectionElement) {
        customersSection.replaceWith(customers.sectionElement);
        // Initialize carousel after a short delay
        setTimeout(() => {
          customers.initCarousel();
        }, 100);
        customers.sectionElement._partnersSection = customers;
      }
    } else {
      // Use render method which handles carousel initialization
      customers.render(mainContent);
      if (customers.sectionElement) {
        customers.sectionElement._partnersSection = customers;
      }
    }
  }

  // Initialize Partners section
  let partnersSection = document.querySelector('#partners');
  if (content.partners) {
    const partners = new PartnersSection(content.partners);
    if (partnersSection) {
      // Replace existing section with new one using render method
      partners.create();
      if (partners.sectionElement) {
        partnersSection.replaceWith(partners.sectionElement);
        // Initialize carousel after a short delay
        setTimeout(() => {
          partners.initCarousel();
        }, 100);
        partners.sectionElement._partnersSection = partners;
      }
    } else {
      // Use render method which handles carousel initialization
      partners.render(mainContent);
      if (partners.sectionElement) {
        partners.sectionElement._partnersSection = partners;
      }
    }
  }

  // Initialize Contacts section
  let contactsSection = document.querySelector('#contacts');
  if (content.contacts) {
    const contacts = new ContactsSection(content.contacts);
    contacts.create();
    if (contacts.sectionElement) {
      if (contactsSection) {
        contactsSection.replaceWith(contacts.sectionElement);
      } else {
        mainContent.appendChild(contacts.sectionElement);
      }
      
      // Initialize contact form after HTML is inserted
      const formContainer = contacts.sectionElement.querySelector(`#${contacts.id}-form-container`);
      if (formContainer && content.contacts.form) {
        const contactForm = new ContactForm({
          id: content.contacts.form.id || 'contact-form',
          endpoint: content.contacts.form.endpoint || '/api/contact',
          fields: content.contacts.form.fields || {}
        });
        contactForm.render(formContainer);
        window.contactFormInstance = contactForm; // Store for language updates
        contacts.sectionElement._contactsSection = contacts; // Store contacts section for updates
      }
    }
  }

  // Refresh scroll animations after adding new sections
  // This will be handled by the main init function, but refresh in case sections were added dynamically
  if (window.scrollAnimationsInstance) {
    window.scrollAnimationsInstance.refresh();
  }
}

/**
 * Update content when language changes
 */
function updateLanguageContent() {
  // Update hero section
  const heroTitle = document.querySelector('.hero-headline');
  const heroSubtitle = document.querySelector('.hero-subheadline');
  if (heroTitle) heroTitle.textContent = t('hero.title');
  if (heroSubtitle) heroSubtitle.textContent = t('hero.subtitle');

  // Update login button
  if (window.loginButtonInstance) {
    window.loginButtonInstance.text = t('nav.login');
    if (window.loginButtonInstance.buttonElement) {
      window.loginButtonInstance.buttonElement.textContent = t('nav.login');
    }
  }

  // Update sections navigation
  if (window.sectionsNavigationInstance) {
    window.sectionsNavigationInstance.sections = [
      { id: 'hero', label: t('nav.home') },
      { id: 'about-company', label: t('nav.about') },
      { id: 'services', label: t('nav.services') },
      { id: 'partners', label: t('nav.partners') },
      { id: 'contacts', label: t('nav.contact') }
    ];
    window.sectionsNavigationInstance.update();
  }

  // Update footer
  const footerText = document.querySelector('#footer .footer-content p');
  if (footerText) {
    footerText.textContent = t('footer.copyright');
  }

  // Update contact form if it exists
  if (window.contactFormInstance) {
    window.contactFormInstance.updateTranslations();
  }

  // Update contacts section labels
  const contactsSection = document.querySelector('#contacts');
  if (contactsSection && contactsSection._contactsSection) {
    // Recreate contact info with new translations
    const contactInfoContainer = contactsSection.querySelector('.contact-info-content');
    if (contactInfoContainer) {
      const contacts = contactsSection._contactsSection;
      contactInfoContainer.innerHTML = contacts._createContactInfo();
    }
  }

  // Reinitialize content sections with new language
  initializeContentSections();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Cleanup moving objects
  const contentSections = document.querySelectorAll('.content-section, section[data-moving-objects]');
  contentSections.forEach(section => {
    if (section._movingObjects) {
      section._movingObjects.dispose();
    }
  });

  // Cleanup parallax controller
  parallaxController.dispose();

  // Cleanup sections navigation
  if (window.sectionsNavigationInstance) {
    window.sectionsNavigationInstance.dispose();
  }

  // Cleanup partners carousel
  const partnersSection = document.querySelector('#partners');
  if (partnersSection && partnersSection._partnersSection) {
    partnersSection._partnersSection.dispose();
  }

  // Stop performance monitoring
  performanceMonitor.stop();

  // Cleanup will be handled by individual components
});

