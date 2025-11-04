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
import { CustomersSection } from '../components/customers-section.js';
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
    title: 'About Our Company',
    subtitle: 'Building enterprise and SME server solutions since 2010',
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
      history: 'Founded in 2010, we began as a boutique server solutions provider focused on helping small and medium businesses achieve enterprise-level infrastructure capabilities. Over the years, we\'ve expanded our services to serve Fortune 500 companies while maintaining our commitment to personalized service for SMEs. Today, we manage server infrastructure for over 800 organizations across various industries, handling millions of requests daily and maintaining an industry-leading 99.99% uptime record. Our team of certified engineers and architects brings decades of combined experience in server architecture, cloud platforms, virtualization, and cybersecurity.'
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
          description: 'End-to-end server deployment services tailored to your business needs. From initial planning and hardware selection to OS installation and configuration, we ensure your servers are optimized for performance, security, and scalability.',
          icon: '🖥️',
          features: [
            'Hardware selection & procurement',
            'OS installation & configuration',
            'Network setup & security hardening',
            'Performance optimization',
            'Documentation & handover'
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
          title: 'Server Security & Hardening',
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
    type: 'customers',
    title: 'What Our Customers Say',
    subtitle: 'Trusted by enterprises and SMEs across industries',
    format: 'testimonials',
    items: [
      {
        type: 'testimonial',
        quote: 'Their server deployment team transformed our infrastructure. We migrated from legacy hardware to a modern virtualized environment with zero downtime. Their expertise in enterprise server solutions is unmatched, and the ongoing support has been exceptional.',
        author: {
          name: 'Sarah Chen',
          role: 'VP of Infrastructure',
          company: 'TechCorp Enterprises'
        },
        logo: '/assets/logos/techcorp.png',
        rating: 5
      },
      {
        type: 'testimonial',
        quote: 'As a growing SME, we needed enterprise-grade infrastructure without enterprise-sized budgets. They designed a scalable solution that has grown with us from 50 to 500 employees. The 24/7 support gives us peace of mind, and their team truly understands our business needs.',
        author: {
          name: 'Michael Rodriguez',
          role: 'IT Director',
          company: 'Innovate Solutions Ltd.'
        },
        logo: '/assets/logos/innovate.png',
        rating: 5
      },
      {
        type: 'testimonial',
        quote: 'We\'ve been working with them for three years, and they\'ve never let us down. Their proactive monitoring caught critical issues before they impacted our operations. The cloud migration they orchestrated reduced our infrastructure costs by 40% while improving performance.',
        author: {
          name: 'Jennifer Park',
          role: 'Chief Technology Officer',
          company: 'Global Dynamics Inc.'
        },
        logo: '/assets/logos/global-dynamics.png',
        rating: 5
      },
      {
        type: 'testimonial',
        quote: 'Their security hardening services helped us pass our SOC 2 audit on the first try. They don\'t just manage servers—they understand compliance requirements and design solutions that meet both technical and regulatory standards. Highly recommended for any enterprise.',
        author: {
          name: 'David Thompson',
          role: 'Head of Security & Compliance',
          company: 'SecureData Systems'
        },
        logo: '/assets/logos/securedata.png',
        rating: 5
      },
      {
        type: 'testimonial',
        quote: 'We\'re a mid-size manufacturer, not a tech company. Their team explained everything in plain language and built a server infrastructure that just works. The disaster recovery plan they put in place saved us during a recent power outage. Couldn\'t be happier.',
        author: {
          name: 'Robert Wilson',
          role: 'Operations Manager',
          company: 'Advanced Manufacturing Co.'
        },
        logo: '/assets/logos/manufacturing.png',
        rating: 5
      },
      {
        type: 'testimonial',
        quote: 'From initial consultation to deployment and ongoing management, their service has been outstanding. They helped us scale our server infrastructure to handle 10x growth without breaking the bank. Their engineers are knowledgeable, responsive, and truly care about our success.',
        author: {
          name: 'Lisa Anderson',
          role: 'Founder & CEO',
          company: 'StartupTech Ventures'
        },
        logo: '/assets/logos/startuptech.png',
        rating: 5
      }
    ],
    backgroundColor: 'var(--bg-secondary)',
    textColor: 'var(--text-primary)'
  },
  partners: {
    id: 'partners',
    type: 'partners',
    title: 'Our Partners',
    subtitle: 'Certified partnerships with industry-leading technology providers',
    partners: [
      {
        id: 'partner-aws',
        name: 'Amazon Web Services',
        logo: '/assets/logos/aws.png',
        description: 'Advanced Consulting Partner',
        website: 'https://aws.amazon.com',
        category: 'Cloud'
      },
      {
        id: 'partner-vmware',
        name: 'VMware',
        logo: '/assets/logos/vmware.png',
        description: 'Cloud Verified Partner',
        website: 'https://www.vmware.com',
        category: 'Software'
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
        id: 'partner-microsoft',
        name: 'Microsoft',
        logo: '/assets/logos/microsoft.png',
        description: 'Gold Partner - Cloud & Enterprise Solutions',
        website: 'https://www.microsoft.com',
        category: 'Cloud'
      },
      {
        id: 'partner-cisco',
        name: 'Cisco',
        logo: '/assets/logos/cisco.png',
        description: 'Partner - Networking & Security',
        website: 'https://www.cisco.com',
        category: 'Networking'
      },
      {
        id: 'partner-hp',
        name: 'HP',
        logo: '/assets/logos/hp.png',
        description: 'Gold Partner - Enterprise Servers',
        website: 'https://www.hp.com',
        category: 'Hardware'
      },
      {
        id: 'partner-intel',
        name: 'Intel',
        logo: '/assets/logos/intel.png',
        description: 'Technology Partner - Processors',
        website: 'https://www.intel.com',
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
        street: '123 Enterprise Street, Suite 500',
        city: 'Tech City',
        state: 'TC',
        zip: '12345',
        country: 'USA'
      },
      phone: '+1 (555) 123-4567',
      email: 'info@serversolutions.com',
      officeHours: 'Business Hours: Monday - Friday, 9 AM - 6 PM EST | 24/7 Emergency Support Available'
    },
    form: {
      id: 'contact-form',
      endpoint: '/api/contact',
      fields: {
        name: { required: true, maxLength: 100 },
        email: { required: true, maxLength: 255 },
        subject: { required: false, maxLength: 200 },
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
  if (navContainer) {
    const navigation = new Navigation();
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
              'Подбор и закупка оборудования',
              'Установка и настройка ОС',
              'Настройка сети и безопасность',
              'Оптимизация производительности',
              'Документация и передача'
            ] : [
              'Hardware selection & procurement',
              'OS installation & configuration',
              'Network setup & security hardening',
              'Performance optimization',
              'Documentation & handover'
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
              'Доступность 24/7/365',
              'Среднее время отклика 5 минут',
              'Сертифицированные инженеры',
              'Диагностика и решение',
              'Приоритетные эскалации'
            ] : [
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
      type: 'customers',
      title: customers.title || t('customers.title'),
      subtitle: customers.subtitle || t('customers.subtitle'),
      format: 'testimonials',
      items: landingPageContent.customers.items, // Keep testimonials as-is for now
      backgroundColor: 'var(--bg-secondary)',
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
    const customers = new CustomersSection(content.customers);
    customers.create();
    if (customers.sectionElement) {
      if (customersSection) {
        customersSection.replaceWith(customers.sectionElement);
      } else {
        mainContent.appendChild(customers.sectionElement);
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

