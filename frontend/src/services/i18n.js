/**
 * Internationalization (i18n) Service
 * Handles language switching and translations
 */

const LANGUAGE_KEY = 'preferred_language';
const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['en', 'ru'];

// Translations
const translations = {
  en: {
    // Navigation
    nav: {
      login: 'Login',
      home: 'Home',
      about: 'About',
      services: 'Services',
      customers: 'Customers',
      partners: 'Partners',
      contact: 'Contact'
    },
    // Hero
    hero: {
      title: 'Enterprise Server Solutions',
      subtitle: 'Reliable, scalable infrastructure for your business'
    },
    // About
    about: {
      title: 'About Our Company',
      subtitle: 'Building enterprise and SME server solutions since 2010',
      background: 'We are a specialized provider of comprehensive server solutions, dedicated to empowering enterprises and small-to-medium businesses with robust, scalable, and reliable infrastructure. Our expertise spans from custom server deployments and cloud migrations to ongoing maintenance and 24/7 monitoring.',
      mission: 'Our mission is to deliver world-class server solutions that enable enterprises and SMEs to achieve their business objectives through reliable, scalable, and cost-effective infrastructure.',
      missionTitle: 'Our Mission',
      valuesTitle: 'Our Values',
      historyTitle: 'Our History',
      history: 'Founded in 2010, we began as a boutique server solutions provider focused on helping small and medium businesses achieve enterprise-level infrastructure capabilities. Today, we manage server infrastructure for over 800 organizations across various industries.',
      values: [
        'Reliability & Uptime Excellence',
        'Security-First Approach',
        'Scalability & Future-Proofing',
        'Enterprise & SME Expertise',
        '24/7 Proactive Support',
        'Innovation & Best Practices'
      ]
    },
    // Services
    services: {
      title: 'Our Services',
      subtitle: 'Comprehensive server solutions for enterprise and SME',
      serverDeployment: {
        title: 'Custom Server Deployment',
        description: 'End-to-end server deployment from planning to configuration, optimized for performance and security.'
      },
      cloudMigration: {
        title: 'Cloud Migration & Hybrid Solutions',
        description: 'Seamless migration to cloud or hybrid solutions with minimal downtime and data integrity.'
      },
      infrastructureManagement: {
        title: 'Infrastructure Management',
        description: 'Comprehensive server management ensuring security, optimization, and alignment with business goals.'
      },
      support: {
        title: '24/7 Technical Support',
        description: 'Round-the-clock monitoring and support from certified engineers with rapid response times.'
      },
      virtualization: {
        title: 'Server Virtualization',
        description: 'Maximize resources through advanced virtualization, reducing costs and improving efficiency.'
      },
      security: {
        title: 'Server Security & Hardening',
        description: 'Comprehensive security services protecting critical infrastructure with the highest standards.'
      },
      backupDisaster: {
        title: 'Backup & Disaster Recovery',
        description: 'Robust backup and disaster recovery solutions ensuring business continuity and rapid restoration.'
      },
      consulting: {
        title: 'Server Architecture Consulting',
        description: 'Strategic guidance for designing, optimizing, and scaling server infrastructure.'
      }
    },
    // Customers
    customers: {
      title: 'What Our Customers Say',
      subtitle: 'Trusted by enterprises and SMEs across industries'
    },
    // Partners
    partners: {
      title: 'Our Partners',
      subtitle: 'Certified partnerships with industry-leading technology providers'
    },
    // Contacts
    contacts: {
      title: 'Contact Us',
      subtitle: 'Get in touch with our server solutions team',
      officeHours: 'Business Hours: Monday - Friday, 9 AM - 6 PM EST | 24/7 Emergency Support Available',
      labels: {
        address: 'Address',
        phone: 'Phone',
        email: 'Email',
        officeHours: 'Office Hours'
      },
      form: {
        name: 'Name',
        email: 'Email',
        subject: 'Subject',
        phone: 'Phone',
        message: 'Message',
        submit: 'Send Message',
        nameRequired: 'Name is required',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email',
        messageRequired: 'Message is required',
        sending: 'Sending...',
        success: 'Message sent successfully!',
        error: 'Error sending message. Please try again.',
        fieldMaxLength: 'must be {maxLength} characters or less',
        genericError: 'An error occurred. Please try again.',
        errorSending: 'An error occurred while sending your message. Please try again later.'
      }
    },
    // Footer
    footer: {
      copyright: '© 2025 Enterprise Server Solutions. All rights reserved.'
    },
    // Login & Auth
    login: {
      title: 'Server Support CRM',
      subtitle: '24/7 Incident Management System',
      signIn: 'Sign In',
      username: 'Username',
      password: 'Password',
      usernamePlaceholder: 'Enter your username',
      passwordPlaceholder: 'Enter your password',
      signingIn: 'Signing in...',
      invalidCredentials: 'Invalid username or password. Please try again.',
      serverError: 'Server error. Please try again later.',
      connectionError: 'Unable to connect to server. Please check your connection.',
      loginError: 'An error occurred during login. Please try again.',
      usernamePasswordRequired: 'Please enter both username and password',
      invalidRole: 'Invalid user role',
      forgotPassword: 'Forgot Password?'
    },
    // Dashboard Common
    dashboard: {
      clientTitle: 'Client Dashboard',
      supportTitle: 'Support Dashboard',
      loggedInAs: 'Logged in as:',
      company: 'Company:',
      logout: 'Logout',
      enterpriseBrand: 'Enterprise Solutions',
      ticketsTab: 'Tickets',
      accountsTab: 'Accounts',
      companiesTab: 'Companies'
    },
    // Ticket Form
    ticketForm: {
      title: 'Submit New Ticket',
      serialNumber: 'Equipment Serial Number',
      serialNumberPlaceholder: 'Enter equipment serial number',
      problemDescription: 'Problem Description',
      problemDescriptionPlaceholder: 'Describe the problem in detail. Note: Each ticket should represent exactly one problem.',
      problemDescriptionHint: 'Each ticket should represent exactly one problem. If you have multiple issues, please submit separate tickets.',
      jobTitle: 'Job Title',
      jobTitlePlaceholder: 'Enter your job title',
      fullName: 'Full Name (FIO)',
      fullNamePlaceholder: 'Enter your full name',
      companyName: 'Company Name',
      companyNamePlaceholder: 'Enter company name',
      submit: 'Submit Ticket',
      submitting: 'Submitting...',
      success: 'Ticket submitted successfully!',
      fieldRequired: 'This field is required',
      maxLength: 'Maximum length is {maxLength} characters',
      noPermission: 'You do not have permission to submit tickets',
      submitError: 'An error occurred while submitting the ticket. Please try again.',
      checkInput: 'Please check your input and try again',
      required: 'required'
    },
    // Ticket List
    ticketList: {
      title: 'My Tickets',
      activeTickets: 'Active Tickets',
      archive: 'Archive',
      noTickets: 'No tickets yet',
      noTicketsText: 'Submit your first ticket to get started',
      noArchivedTickets: 'No Archived Tickets',
      noArchivedTicketsText: 'Closed tickets will appear here',
      ticketNumber: 'Ticket #',
      problemDescription: 'Problem Description:',
      serialNumber: 'Serial Number:',
      submitted: 'Submitted:',
      estimatedCompletion: 'Estimated Completion:',
      assignedEngineer: 'Assigned Engineer:',
      openChat: 'Open Chat',
      notSet: 'Not set',
      loadingTickets: 'Loading tickets...',
      loading: 'Loading...',
      errorLoading: 'Error loading tickets:',
      errorLoadingArchive: 'Error loading archive',
      retry: 'Retry',
      statusLabel: 'Status:',
      generateReport: 'Generate Report'
    },
    // Ticket Management
    ticketManagement: {
      title: 'Ticket Management',
      noTickets: 'No tickets found',
      noTicketsText: 'Try adjusting your filters',
      ticketNumber: 'Ticket #',
      problemDescription: 'Problem Description:',
      serialNumber: 'Serial Number:',
      companyName: 'Company:',
      submitted: 'Submitted:',
      status: 'Status:',
      priority: 'Priority:',
      assignedEngineer: 'Assigned Engineer:',
      estimatedCompletion: 'Estimated Completion:',
      estimatedCompletionLabel: 'Estimated Completion Date:',
      updateStatus: 'Update Status',
      assignEngineer: 'Assign Engineer',
      assignEngineerLabel: 'Assign Engineer',
      assignToMe: 'Assign to Me',
      unassign: 'Unassign',
      unassigned: 'Unassigned',
      setCompletionDate: 'Set Completion Date',
      openChat: 'Open Chat',
      update: 'Update',
      cancel: 'Cancel',
      save: 'Save',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      notSet: 'Not set',
      none: 'None',
      loading: 'Loading tickets...',
      errorLoading: 'Error loading tickets:',
      updateSuccess: 'Ticket updated successfully',
      updateError: 'Error updating ticket. Please try again.',
      masterOnlyManualAssignment: 'Only master accounts can manually assign tickets',
      activeTickets: 'Active Tickets',
      archive: 'Archive',
      restore: 'Restore',
      confirmRestore: 'Restore this ticket from archive?',
      restoreSuccess: 'Ticket restored successfully',
      restoreError: 'Error restoring ticket',
      noArchivedTickets: 'No Archived Tickets',
      noArchivedTicketsText: 'Closed tickets will appear here',
      errorLoadingArchive: 'Error loading archive'
    },
    // Client Generator
    clientGenerator: {
      title: 'Generate Client Account',
      companyName: 'Company Name',
      companyNamePlaceholder: 'Enter company name',
      generate: 'Generate Client Account',
      generating: 'Generating...',
      companyNameRequired: 'Company name is required',
      accountCreated: 'Client Account Created',
      username: 'Username:',
      password: 'Password:',
      codephrase: 'Recovery Codephrase:',
      copy: 'Copy',
      close: 'Close',
      copied: 'Copied!',
      saveCredentials: 'Please save these credentials. The password cannot be retrieved later.',
      errorGenerating: 'Error generating client account. Please try again.'
    },
    // Admin Management
    adminManagement: {
      title: 'Administrator Management',
      createAdmin: 'Create Administrator',
      addNewAdmin: 'Add New Administrator',
      username: 'Username',
      login: 'Login',
      usernamePlaceholder: 'Enter username',
      password: 'Password',
      passwordPlaceholder: 'Enter password',
      create: 'Create',
      add: 'Add Administrator',
      creating: 'Creating...',
      adding: 'Adding...',
      deleting: 'Deleting...',
      delete: 'Delete',
      usernameRequired: 'Username is required',
      passwordRequired: 'Password is required',
      adminCreated: 'Administrator created successfully',
      adminAdded: 'Administrator added successfully',
      adminDeleted: 'Administrator deleted successfully',
      errorCreating: 'Error creating administrator. Please try again.',
      errorAdding: 'Error adding administrator:',
      errorDeleting: 'Error deleting administrator:',
      confirmDelete: 'Are you sure you want to delete administrator',
      cannotDeleteLast: 'Cannot delete the last administrator. At least one administrator must remain.',
      adminsList: 'Administrators',
      noAdmins: 'No administrators found',
      loading: 'Loading administrators...',
      errorLoading: 'Error loading administrators:',
      created: 'Created:',
      id: 'ID:',
      deleteTitle: 'Delete administrator',
      loginImmutable: 'Login cannot be changed',
      loginHelp: 'Login cannot be changed after creation',
      masterOnly: 'Only master accounts can create and delete administrators.',
      editDisplayName: 'Edit display name',
      saveTitle: 'Save',
      cancelTitle: 'Cancel',
      saving: 'Saving...',
      displayNameRequired: 'Display name is required',
      displayNameTooLong: 'Display name must be 100 characters or less',
      displayNameInvalid: 'Display name contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed.',
      displayNameUpdated: 'Display name updated successfully',
      cannotEditOthersDisplayName: 'You can only edit your own display name',
      errorUpdating: 'Error updating display name',
      cannotDeleteLastMaster: 'System requires at least 2 master accounts',
      cannotDeleteOwnMaster: 'Cannot delete your own master account. At least 2 master accounts must remain.',
      accountType: 'Account Type',
      regularAdministrator: 'Regular Administrator',
      masterAccount: 'Master Account',
      accountTypeHelp: 'Choose an account type based on required permissions',
      changePassword: 'Change Password',
      changePasswordTitle: 'Change password',
      enterNewPassword: 'Enter new password for',
      passwordChanged: 'Password changed successfully',
      errorChangingPassword: 'Error changing password',
      adminNotFound: 'Administrator not found'
    },
    // Report Modal
    reportModal: {
      title: 'Generate Ticket Report',
      loginRequired: 'Please log in to generate reports',
      dateFrom: 'From Date',
      dateTo: 'To Date',
      status: 'Status',
      allTickets: 'All Tickets',
      statusNew: 'New',
      statusInProgress: 'In Progress',
      statusWaiting: 'Waiting for Client',
      statusResolved: 'Resolved',
      statusClosed: 'Closed',
      jobTitle: 'Job Title',
      jobTitlePlaceholder: 'Filter by job title...',
      clientName: 'Client Name',
      clientNamePlaceholder: 'Filter by client name...',
      assignedEngineer: 'Assigned Engineer',
      engineerPlaceholder: 'Engineer ID...',
      cancel: 'Cancel',
      generate: 'Generate Report',
      generating: 'Generating...',
      invalidDateRange: 'From date must be before or equal to To date',
      validationError: 'Invalid filter values',
      permissionDenied: 'Permission denied',
      generationError: 'Error generating report'
    },
    // Filters
    filters: {
      title: 'Filters',
      status: 'Status',
      priority: 'Priority',
      assignedTo: 'Assigned To',
      company: 'Company',
      all: 'All',
      clearFilters: 'Clear Filters',
      allStatuses: 'All Statuses',
      allEngineers: 'All Engineers',
      allCompanies: 'All Companies',
      startDate: 'Start Date',
      endDate: 'End Date',
      showMyTicketsOnly: 'Show only my tickets',
      clear: 'Clear'
    },
    // Chat
    chat: {
      title: 'Chat - Ticket #',
      placeholder: 'Type your message...',
      send: 'Send',
      sending: 'Sending...',
      errorSending: 'Error sending message. Please try again.',
      loading: 'Loading messages...',
      noMessages: 'No messages yet. Start the conversation!',
      userInfoUnavailable: 'User information not available',
      errorOpening: 'Error opening chat:',
      close: 'Close'
    },
    // Status & Priority
    status: {
      new: 'New',
      in_progress: 'In Progress',
      waiting_for_client: 'Waiting for Client',
      resolved: 'Resolved',
      closed: 'Closed'
    },
    priority: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    },
    // Common UI
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      retry: 'Retry',
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      update: 'Update',
      submit: 'Submit',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      search: 'Search',
      filter: 'Filter',
      clear: 'Clear',
      select: 'Select',
      selectAll: 'Select All',
      none: 'None',
      notSet: 'Not set',
      required: 'Required',
      optional: 'Optional',
      copy: 'Copy',
      copied: 'Copied!'
    },
    // Notifications
    notifications: {
      title: 'Notifications',
      noNotifications: 'No new notifications',
      markAllRead: 'Mark all as read',
      newMessage: 'New message',
      ticketUpdated: 'Ticket updated',
      ticketAssigned: 'Ticket assigned'
    },
    // Company Management
    companyManagement: {
      title: 'Company Accounts',
      filterCompanyName: 'Company Name',
      filterClientName: 'Client Name',
      filterJobTitle: 'Job Title',
      filterEquipmentId: 'Equipment ID',
      filterPlaceholder: 'Search...',
      companyList: 'List of company accounts',
      noCompaniesFound: 'No companies found',
      equipmentIds: 'Equipment IDs:',
      noEquipmentIds: 'No equipment IDs submitted yet',
      changePassword: 'Change Password',
      generate: 'Generate Password',
      revealPassword: 'Show',
      hidePassword: 'Hide',
      changing: 'Changing...',
      generating: 'Generating...',
      changePasswordFor: 'Change password for',
      generatePasswordFor: 'Generate new password for',
      passwordChanged: 'Password changed successfully',
      passwordGenerated: 'New password generated',
      enterNewPassword: 'Enter new password',
      newPasswordRequired: 'New password is required',
      confirmChange: 'Change password for this company?',
      confirmGenerate: 'Generate a new password for this company?',
      errorChanging: 'Error changing password',
      errorGenerating: 'Error generating password',
      errorLoading: 'Error loading companies',
      copyPassword: 'Copy Password',
      passwordCopied: 'Password copied to clipboard',
      passwordCannotBeRevealed: 'Password cannot be revealed. It is stored securely and can only be viewed when changed or generated.',
      delete: 'Delete',
      deleteCompany: 'Delete Company Account',
      deleting: 'Deleting...',
      confirmDelete: 'Are you sure you want to delete the company account "{company}"?\n\nThis will permanently delete:\n- The company account\n- All associated tickets\n- All chat messages\n\nThis action cannot be undone.',
      confirmDeleteQuestion: 'Are you sure you want to delete',
      warning: 'Warning: This action cannot be undone',
      deleteWarning: 'This will permanently delete:',
      deleteWarningAccount: 'The company account',
      deleteWarningTickets: 'All associated tickets',
      deleteWarningMessages: 'All chat messages',
      deleteConfirm: 'Delete Company',
      companyDeletedSuccessfully: 'Company account deleted successfully',
      errorDeleting: 'Error deleting company account'
    },
    // Password Recovery
    recovery: {
      title: 'Password Recovery',
      enterCodephrase: 'Enter your recovery codephrase to reset your password.',
      codephraseLabel: 'Recovery Codephrase',
      codephrasePlaceholder: 'word-word-1234',
      codephraseRequired: 'Codephrase is required',
      codephraseInvalid: 'Invalid codephrase. Please check and try again.',
      recover: 'Recover',
      processing: 'Processing...',
      forgotCodephrase: "I don't remember the code phrase/word",
      enterNewPassword: 'Enter your new password below.',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'Enter new password (min 8 characters)',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm new password',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 8 characters long',
      passwordsMismatch: 'Passwords do not match',
      resetPassword: 'Reset Password',
      resetting: 'Resetting...',
      success: 'Password reset successfully!',
      successMessage: 'You can now log in with your new password.',
      goToLogin: 'Go to Login',
      contactSupport: 'Contact Support',
      supportDescription: "If you don't remember your recovery codephrase, please contact our support team.",
      supportPhone: 'Phone:',
      supportLoading: 'Loading...',
      supportNotAvailable: 'Not available',
      supportInstructions: 'Important: Please have your equipment ID ready when you call.',
      back: 'Back',
      tokenExpired: 'Recovery token expired. Please start over.',
      errorOccurred: 'An error occurred. Please try again later.'
    }
  },
  ru: {
    // Navigation
    nav: {
      login: 'Вход',
      home: 'Главная',
      about: 'О компании',
      services: 'Услуги',
      customers: 'Клиенты',
      partners: 'Партнеры',
      contact: 'Контакты'
    },
    // Hero
    hero: {
      title: 'Корпоративные серверные решения',
      subtitle: 'Надежная и масштабируемая инфраструктура для вашего бизнеса'
    },
    // About
    about: {
      title: 'О нашей компании',
      subtitle: 'Создаем серверные решения для предприятий и малого бизнеса с 2010 года',
      background: 'Мы специализируемся на комплексных серверных решениях для предприятий и малого бизнеса. Наш опыт охватывает развертывание серверов, миграцию в облако и постоянное обслуживание с круглосуточным мониторингом.',
      mission: 'Наша миссия — предоставлять серверные решения мирового класса, которые помогают предприятиям достигать бизнес-целей через надежную, масштабируемую и экономически эффективную инфраструктуру.',
      missionTitle: 'Наша миссия',
      valuesTitle: 'Наши ценности',
      historyTitle: 'Наша история',
      history: 'Основанная в 2010 году, мы начали как компания по серверным решениям, помогая малому и среднему бизнесу получить корпоративный уровень инфраструктуры. Сегодня мы управляем серверной инфраструктурой для более чем 800 организаций в различных отраслях.',
      values: [
        'Надежность и отказоустойчивость',
        'Безопасность превыше всего',
        'Масштабируемость',
        'Экспертиза для бизнеса',
        'Круглосуточная поддержка',
        'Инновации и лучшие практики'
      ]
    },
    // Services
    services: {
      title: 'Наши услуги',
      subtitle: 'Комплексные серверные решения для предприятий и малого бизнеса',
      serverDeployment: {
        title: 'Развертывание серверов',
        description: 'Полный цикл от планирования до настройки, оптимизировано для производительности и безопасности.'
      },
      cloudMigration: {
        title: 'Миграция в облако',
        description: 'Бесперебойная миграция в облако или гибридные решения с минимальным простоем.'
      },
      infrastructureManagement: {
        title: 'Управление инфраструктурой',
        description: 'Комплексное управление серверами с обеспечением безопасности и оптимизации.'
      },
      support: {
        title: 'Техподдержка 24/7',
        description: 'Круглосуточный мониторинг и поддержка от сертифицированных инженеров.'
      },
      virtualization: {
        title: 'Виртуализация серверов',
        description: 'Максимизация ресурсов через виртуализацию, снижение затрат и повышение эффективности.'
      },
      security: {
        title: 'Безопасность серверов',
        description: 'Комплексные услуги безопасности для защиты критической инфраструктуры.'
      },
      backupDisaster: {
        title: 'Резервное копирование',
        description: 'Надежные решения для резервного копирования и восстановления после сбоев.'
      },
      consulting: {
        title: 'Консалтинг по архитектуре',
        description: 'Стратегические рекомендации по проектированию и масштабированию инфраструктуры.'
      }
    },
    // Customers
    customers: {
      title: 'Отзывы наших клиентов',
      subtitle: 'Нам доверяют предприятия и малый бизнес в различных отраслях'
    },
    // Partners
    partners: {
      title: 'Наши партнеры',
      subtitle: 'Сертифицированное партнерство с ведущими технологическими компаниями'
    },
    // Contacts
    contacts: {
      title: 'Связаться с нами',
      subtitle: 'Свяжитесь с нашей командой по серверным решениям',
      officeHours: 'Рабочее время: Понедельник - Пятница, 9:00 - 18:00 МСК | Круглосуточная экстренная поддержка',
      labels: {
        address: 'Адрес',
        phone: 'Телефон',
        email: 'Email',
        officeHours: 'Рабочее время'
      },
      form: {
        name: 'Имя',
        email: 'Email',
        subject: 'Тема',
        phone: 'Телефон',
        message: 'Сообщение',
        submit: 'Отправить сообщение',
        nameRequired: 'Имя обязательно',
        emailRequired: 'Email обязателен',
        emailInvalid: 'Введите корректный email',
        messageRequired: 'Сообщение обязательно',
        sending: 'Отправка...',
        success: 'Сообщение успешно отправлено!',
        error: 'Ошибка отправки. Попробуйте еще раз.',
        fieldMaxLength: 'должно быть не более {maxLength} символов',
        genericError: 'Произошла ошибка. Попробуйте еще раз.',
        errorSending: 'Произошла ошибка при отправке сообщения. Попробуйте позже.'
      }
    },
    // Footer
    footer: {
      copyright: '© 2025 Enterprise Server Solutions. Все права защищены.'
    },
    // Login & Auth
    login: {
      title: 'CRM Поддержки Серверов',
      subtitle: 'Система управления инцидентами 24/7',
      signIn: 'Войти',
      username: 'Имя пользователя',
      password: 'Пароль',
      usernamePlaceholder: 'Введите имя пользователя',
      passwordPlaceholder: 'Введите пароль',
      signingIn: 'Вход...',
      invalidCredentials: 'Неверное имя пользователя или пароль. Попробуйте еще раз.',
      serverError: 'Ошибка сервера. Попробуйте позже.',
      connectionError: 'Не удалось подключиться к серверу. Проверьте подключение.',
      loginError: 'Произошла ошибка при входе. Попробуйте еще раз.',
      usernamePasswordRequired: 'Пожалуйста, введите имя пользователя и пароль',
      invalidRole: 'Неверная роль пользователя',
      forgotPassword: 'Забыли пароль?'
    },
    // Dashboard Common
    dashboard: {
      clientTitle: 'Панель клиента',
      supportTitle: 'Панель поддержки',
      loggedInAs: 'Вход выполнен как:',
      company: 'Компания:',
      logout: 'Выйти',
      enterpriseBrand: 'Enterprise Solutions',
      ticketsTab: 'Заявки',
      accountsTab: 'Аккаунты',
      companiesTab: 'Компании'
    },
    // Ticket Form
    ticketForm: {
      title: 'Создать новую заявку',
      serialNumber: 'Серийный номер оборудования',
      serialNumberPlaceholder: 'Введите серийный номер оборудования',
      problemDescription: 'Описание проблемы',
      problemDescriptionPlaceholder: 'Опишите проблему подробно. Примечание: Каждая заявка должна представлять ровно одну проблему.',
      problemDescriptionHint: 'Каждая заявка должна представлять ровно одну проблему. Если у вас несколько проблем, пожалуйста, создайте отдельные заявки.',
      jobTitle: 'Должность',
      jobTitlePlaceholder: 'Введите вашу должность',
      fullName: 'Полное имя (ФИО)',
      fullNamePlaceholder: 'Введите ваше полное имя',
      companyName: 'Название компании',
      companyNamePlaceholder: 'Введите название компании',
      submit: 'Отправить заявку',
      submitting: 'Отправка...',
      success: 'Заявка успешно отправлена!',
      fieldRequired: 'Это поле обязательно',
      maxLength: 'Максимальная длина {maxLength} символов',
      noPermission: 'У вас нет разрешения на создание заявок',
      submitError: 'Произошла ошибка при отправке заявки. Попробуйте еще раз.',
      checkInput: 'Пожалуйста, проверьте введенные данные и попробуйте еще раз',
      required: 'обязательно'
    },
    // Ticket List
    ticketList: {
      title: 'Мои заявки',
      activeTickets: 'Активные заявки',
      archive: 'Архив',
      noTickets: 'Заявок пока нет',
      noTicketsText: 'Создайте вашу первую заявку, чтобы начать',
      noArchivedTickets: 'Нет архивных заявок',
      noArchivedTicketsText: 'Закрытые заявки будут отображаться здесь',
      ticketNumber: 'Заявка №',
      problemDescription: 'Описание проблемы:',
      serialNumber: 'Серийный номер:',
      submitted: 'Отправлено:',
      estimatedCompletion: 'Ожидаемое завершение:',
      assignedEngineer: 'Назначенный инженер:',
      openChat: 'Открыть чат',
      notSet: 'Не установлено',
      loadingTickets: 'Загрузка заявок...',
      loading: 'Загрузка...',
      errorLoading: 'Ошибка загрузки заявок:',
      errorLoadingArchive: 'Ошибка загрузки архива',
      retry: 'Повторить',
      statusLabel: 'Статус:',
      generateReport: 'Сформировать отчёт'
    },
    // Ticket Management
    ticketManagement: {
      title: 'Управление заявками',
      noTickets: 'Заявки не найдены',
      noTicketsText: 'Попробуйте изменить фильтры',
      ticketNumber: 'Заявка №',
      problemDescription: 'Описание проблемы:',
      serialNumber: 'Серийный номер:',
      companyName: 'Компания:',
      submitted: 'Отправлено:',
      status: 'Статус:',
      priority: 'Приоритет:',
      assignedEngineer: 'Назначенный инженер:',
      estimatedCompletion: 'Ожидаемое завершение:',
      estimatedCompletionLabel: 'Ожидаемая дата завершения:',
      updateStatus: 'Изменить статус',
      assignEngineer: 'Назначить инженера',
      assignEngineerLabel: 'Назначить инженера',
      assignToMe: 'Назначить на меня',
      unassign: 'Снять назначение',
      unassigned: 'Не назначен',
      setCompletionDate: 'Установить дату завершения',
      openChat: 'Открыть чат',
      update: 'Обновить',
      cancel: 'Отмена',
      save: 'Сохранить',
      saveChanges: 'Сохранить изменения',
      saving: 'Сохранение...',
      notSet: 'Не установлено',
      none: 'Нет',
      loading: 'Загрузка заявок...',
      errorLoading: 'Ошибка загрузки заявок:',
      updateSuccess: 'Заявка успешно обновлена',
      updateError: 'Ошибка обновления заявки. Попробуйте еще раз.',
      masterOnlyManualAssignment: 'Только мастер-аккаунты могут вручную назначать заявки',
      activeTickets: 'Активные заявки',
      archive: 'Архив',
      restore: 'Восстановить',
      confirmRestore: 'Восстановить эту заявку из архива?',
      restoreSuccess: 'Заявка успешно восстановлена',
      restoreError: 'Ошибка восстановления заявки',
      noArchivedTickets: 'Нет архивных заявок',
      noArchivedTicketsText: 'Закрытые заявки будут отображаться здесь',
      errorLoadingArchive: 'Ошибка загрузки архива'
    },
    // Client Generator
    clientGenerator: {
      title: 'Создать аккаунт клиента',
      companyName: 'Название компании',
      companyNamePlaceholder: 'Введите название компании',
      generate: 'Создать аккаунт клиента',
      generating: 'Создание...',
      companyNameRequired: 'Название компании обязательно',
      accountCreated: 'Аккаунт клиента создан',
      username: 'Имя пользователя:',
      password: 'Пароль:',
      codephrase: 'Кодовое слово для восстановления:',
      copy: 'Копировать',
      close: 'Закрыть',
      copied: 'Скопировано!',
      saveCredentials: 'Пожалуйста, сохраните эти учетные данные. Пароль нельзя будет получить позже.',
      errorGenerating: 'Ошибка создания аккаунта клиента. Попробуйте еще раз.'
    },
    // Admin Management
    adminManagement: {
      title: 'Управление администраторами',
      createAdmin: 'Создать администратора',
      addNewAdmin: 'Добавить нового администратора',
      username: 'Имя пользователя',
      login: 'Логин',
      usernamePlaceholder: 'Введите имя пользователя',
      password: 'Пароль',
      passwordPlaceholder: 'Введите пароль',
      create: 'Создать',
      add: 'Добавить администратора',
      creating: 'Создание...',
      adding: 'Добавление...',
      deleting: 'Удаление...',
      delete: 'Удалить',
      usernameRequired: 'Имя пользователя обязательно',
      passwordRequired: 'Пароль обязателен',
      adminCreated: 'Администратор успешно создан',
      adminAdded: 'Администратор успешно добавлен',
      adminDeleted: 'Администратор успешно удален',
      errorCreating: 'Ошибка создания администратора. Попробуйте еще раз.',
      errorAdding: 'Ошибка добавления администратора:',
      errorDeleting: 'Ошибка удаления администратора:',
      confirmDelete: 'Вы уверены, что хотите удалить администратора',
      cannotDeleteLast: 'Невозможно удалить последнего администратора. Должен остаться хотя бы один администратор.',
      adminsList: 'Администраторы',
      noAdmins: 'Администраторы не найдены',
      loading: 'Загрузка администраторов...',
      errorLoading: 'Ошибка загрузки администраторов:',
      created: 'Создан:',
      id: 'ID:',
      deleteTitle: 'Удалить администратора',
      loginImmutable: 'Логин нельзя изменить',
      loginHelp: 'Логин нельзя изменить после создания',
      masterOnly: 'Только мастер-аккаунты могут создавать и удалять администраторов.',
      editDisplayName: 'Изменить отображаемое имя',
      saveTitle: 'Сохранить',
      cancelTitle: 'Отмена',
      saving: 'Сохранение...',
      displayNameRequired: 'Отображаемое имя обязательно',
      displayNameTooLong: 'Отображаемое имя должно быть не более 100 символов',
      displayNameInvalid: 'Отображаемое имя содержит недопустимые символы. Разрешены только буквы, цифры, пробелы и обычная пунктуация.',
      displayNameUpdated: 'Отображаемое имя успешно обновлено',
      cannotEditOthersDisplayName: 'Вы можете редактировать только свое отображаемое имя',
      errorUpdating: 'Ошибка обновления отображаемого имени',
      cannotDeleteLastMaster: 'Системе требуется не менее 2 мастер-аккаунтов',
      cannotDeleteOwnMaster: 'Нельзя удалить свой мастер-аккаунт. Должно остаться не менее 2 мастер-аккаунтов.',
      accountType: 'Тип аккаунта',
      regularAdministrator: 'Обычный администратор',
      masterAccount: 'Мастер-аккаунт',
      accountTypeHelp: 'Выберите тип аккаунта на основе требуемых прав доступа',
      changePassword: 'Изменить пароль',
      changePasswordTitle: 'Изменить пароль',
      enterNewPassword: 'Введите новый пароль для',
      passwordChanged: 'Пароль успешно изменен',
      errorChangingPassword: 'Ошибка изменения пароля',
      adminNotFound: 'Администратор не найден'
    },
    // Report Modal
    reportModal: {
      title: 'Сформировать отчёт по заявкам',
      loginRequired: 'Войдите в систему для формирования отчёта',
      dateFrom: 'Дата с',
      dateTo: 'Дата по',
      status: 'Статус',
      allTickets: 'Все заявки',
      statusNew: 'Новая',
      statusInProgress: 'В работе',
      statusWaiting: 'Ожидает клиента',
      statusResolved: 'Решена',
      statusClosed: 'Закрыта',
      jobTitle: 'Должность',
      jobTitlePlaceholder: 'Фильтр по должности...',
      clientName: 'Имя клиента',
      clientNamePlaceholder: 'Фильтр по имени клиента...',
      assignedEngineer: 'Назначенный инженер',
      engineerPlaceholder: 'ID инженера...',
      cancel: 'Отмена',
      generate: 'Сформировать отчёт',
      generating: 'Формирование...',
      invalidDateRange: 'Дата "с" должна быть раньше или равна дате "по"',
      validationError: 'Неверные значения фильтров',
      permissionDenied: 'Доступ запрещён',
      generationError: 'Ошибка при формировании отчёта'
    },
    // Filters
    filters: {
      title: 'Фильтры',
      status: 'Статус',
      priority: 'Приоритет',
      assignedTo: 'Назначен',
      company: 'Компания',
      all: 'Все',
      clearFilters: 'Очистить фильтры',
      allStatuses: 'Все статусы',
      allEngineers: 'Все инженеры',
      allCompanies: 'Все компании',
      startDate: 'Дата начала',
      endDate: 'Дата окончания',
      showMyTicketsOnly: 'Показать только мои заявки',
      clear: 'Очистить'
    },
    // Chat
    chat: {
      title: 'Чат - Заявка №',
      placeholder: 'Введите ваше сообщение...',
      send: 'Отправить',
      sending: 'Отправка...',
      errorSending: 'Ошибка отправки сообщения. Попробуйте еще раз.',
      loading: 'Загрузка сообщений...',
      noMessages: 'Сообщений пока нет. Начните разговор!',
      userInfoUnavailable: 'Информация о пользователе недоступна',
      errorOpening: 'Ошибка открытия чата:',
      close: 'Закрыть'
    },
    // Status & Priority
    status: {
      new: 'Новая',
      in_progress: 'В работе',
      waiting_for_client: 'Ожидание клиента',
      resolved: 'Решена',
      closed: 'Закрыта'
    },
    priority: {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      urgent: 'Срочный'
    },
    // Common UI
    common: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успешно',
      retry: 'Повторить',
      close: 'Закрыть',
      cancel: 'Отмена',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Редактировать',
      update: 'Обновить',
      submit: 'Отправить',
      confirm: 'Подтвердить',
      back: 'Назад',
      next: 'Далее',
      previous: 'Назад',
      search: 'Поиск',
      filter: 'Фильтр',
      clear: 'Очистить',
      select: 'Выбрать',
      selectAll: 'Выбрать все',
      none: 'Нет',
      notSet: 'Не установлено',
      required: 'Обязательно',
      optional: 'Необязательно',
      copy: 'Копировать',
      copied: 'Скопировано!'
    },
    // Notifications
    notifications: {
      title: 'Уведомления',
      noNotifications: 'Нет новых уведомлений',
      markAllRead: 'Отметить все как прочитанные',
      newMessage: 'Новое сообщение',
      ticketUpdated: 'Заявка обновлена',
      ticketAssigned: 'Заявка назначена'
    },
    // Company Management
    companyManagement: {
      title: 'Управление компаниями',
      filterCompanyName: 'Название компании',
      filterClientName: 'Имя клиента',
      filterJobTitle: 'Должность',
      filterEquipmentId: 'ID оборудования',
      filterPlaceholder: 'Поиск...',
      companyList: 'Список аккаунтов компаний',
      noCompaniesFound: 'Компании не найдены',
      equipmentIds: 'ID оборудования:',
      noEquipmentIds: 'ID оборудования еще не были отправлены',
      changePassword: 'Изменить пароль',
      generate: 'Сгенерировать пароль',
      revealPassword: 'Показать',
      hidePassword: 'Скрыть',
      changing: 'Изменение...',
      generating: 'Генерация...',
      changePasswordFor: 'Изменить пароль для',
      generatePasswordFor: 'Сгенерировать новый пароль для',
      passwordChanged: 'Пароль успешно изменен',
      passwordGenerated: 'Новый пароль сгенерирован',
      enterNewPassword: 'Введите новый пароль',
      newPasswordRequired: 'Новый пароль обязателен',
      confirmChange: 'Изменить пароль для этой компании?',
      confirmGenerate: 'Сгенерировать новый пароль для этой компании?',
      errorChanging: 'Ошибка изменения пароля',
      errorGenerating: 'Ошибка генерации пароля',
      errorLoading: 'Ошибка загрузки компаний',
      copyPassword: 'Копировать пароль',
      passwordCopied: 'Пароль скопирован в буфер обмена',
      passwordCannotBeRevealed: 'Пароль не может быть показан. Он хранится в зашифрованном виде и может быть просмотрен только при изменении или генерации.',
      delete: 'Удалить',
      deleteCompany: 'Удалить аккаунт компании',
      deleting: 'Удаление...',
      confirmDelete: 'Вы уверены, что хотите удалить аккаунт компании "{company}"?\n\nЭто навсегда удалит:\n- Аккаунт компании\n- Все связанные заявки\n- Все сообщения в чате\n\nЭто действие нельзя отменить.',
      confirmDeleteQuestion: 'Вы уверены, что хотите удалить',
      warning: 'Предупреждение: Это действие нельзя отменить',
      deleteWarning: 'Это навсегда удалит:',
      deleteWarningAccount: 'Аккаунт компании',
      deleteWarningTickets: 'Все связанные заявки',
      deleteWarningMessages: 'Все сообщения в чате',
      deleteConfirm: 'Удалить компанию',
      companyDeletedSuccessfully: 'Аккаунт компании успешно удален',
      errorDeleting: 'Ошибка удаления аккаунта компании'
    },
    // Password Recovery
    recovery: {
      title: 'Восстановление пароля',
      enterCodephrase: 'Введите ваше кодовое слово для восстановления пароля.',
      codephraseLabel: 'Кодовое слово для восстановления',
      codephrasePlaceholder: 'слово-слово-1234',
      codephraseRequired: 'Кодовое слово обязательно',
      codephraseInvalid: 'Неверное кодовое слово. Проверьте и попробуйте еще раз.',
      recover: 'Восстановить',
      processing: 'Обработка...',
      forgotCodephrase: "Я не помню кодовое слово",
      enterNewPassword: 'Введите ваш новый пароль ниже.',
      newPasswordLabel: 'Новый пароль',
      newPasswordPlaceholder: 'Введите новый пароль (минимум 8 символов)',
      confirmPasswordLabel: 'Подтвердите пароль',
      confirmPasswordPlaceholder: 'Подтвердите новый пароль',
      passwordRequired: 'Пароль обязателен',
      passwordTooShort: 'Пароль должен быть не менее 8 символов',
      passwordsMismatch: 'Пароли не совпадают',
      resetPassword: 'Сбросить пароль',
      resetting: 'Сброс...',
      success: 'Пароль успешно сброшен!',
      successMessage: 'Теперь вы можете войти с новым паролем.',
      goToLogin: 'Перейти к входу',
      contactSupport: 'Связаться с поддержкой',
      supportDescription: 'Если вы не помните кодовое слово для восстановления, пожалуйста, свяжитесь с нашей службой поддержки.',
      supportPhone: 'Телефон:',
      supportLoading: 'Загрузка...',
      supportNotAvailable: 'Недоступно',
      supportInstructions: 'Важно: Пожалуйста, подготовьте ID вашего оборудования перед звонком.',
      back: 'Назад',
      tokenExpired: 'Срок действия токена восстановления истек. Пожалуйста, начните заново.',
      errorOccurred: 'Произошла ошибка. Пожалуйста, попробуйте позже.'
    }
  }
};

/**
 * Get current language from storage or browser preference
 * @returns {string} Language code
 */
export function getCurrentLanguage() {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
    return stored;
  }
  
  // Try to detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(browserLang)) {
    return browserLang;
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Set current language
 * @param {string} lang - Language code
 */
export function setLanguage(lang) {
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    localStorage.setItem(LANGUAGE_KEY, lang);
    // Dispatch event for components to react
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
    return true;
  }
  return false;
}

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'nav.login')
 * @param {string} lang - Language code (optional, defaults to current)
 * @returns {string} Translated text
 */
export function t(key, lang = null) {
  const currentLang = lang || getCurrentLanguage();
  const keys = key.split('.');
  let value = translations[currentLang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if translation missing
      value = translations[DEFAULT_LANGUAGE];
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Get all translations for a section
 * @param {string} section - Section key (e.g., 'nav')
 * @param {string} lang - Language code (optional)
 * @returns {object} Translation object
 */
export function getSection(section, lang = null) {
  const currentLang = lang || getCurrentLanguage();
  return translations[currentLang][section] || translations[DEFAULT_LANGUAGE][section] || {};
}

/**
 * Check if language is supported
 * @param {string} lang - Language code
 * @returns {boolean}
 */
export function isLanguageSupported(lang) {
  return SUPPORTED_LANGUAGES.includes(lang);
}

/**
 * Get supported languages
 * @returns {string[]} Array of language codes
 */
export function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}

