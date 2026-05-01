/**
 * Centralised, user-facing strings for the Knowledge surface.
 * Keeping them in one place makes future i18n a single-file migration
 * and preserves a clear line-by-line mapping from requirement → copy.
 */

export const knowledgeCopy = {
  page: {
    title: 'Knowledge',
    subtitle:
      'Group knowledge sources into collections so agents can answer with the right context.',
    infoTip:
      'Collections group knowledge sources together so agents can answer with the right context.',
    tabs: {
      collection: 'Collection',
      sources: 'Sources',
    },
    search: 'Search collections',
    usedByAll: 'All agents',
    create: '+ Create collection',
    view: { grid: 'Grid view', list: 'List view' },
  },

  landing: {
    emptyTitle: "Let's make your AI agent more knowledgeable",
    emptyDescription: 'Create a collection of knowledge sources.',
    cardMenu: { rename: 'Rename', duplicate: 'Duplicate', delete: 'Delete' },
    cardSourcesLabel: (n: number) => `${n} source${n === 1 ? '' : 's'}`,
  },

  detail: {
    back: 'Knowledge',
    subtabs: { sources: 'Sources', usedBy: 'Used by', history: 'History' },
    addSource: 'Add source',
    addSourceMenu: {
      files: 'Files',
      article: 'Article',
      websites: 'Websites',
      sharepoint: 'SharePoint',
    },
    overflowMenu: {
      rename: 'Rename',
      archive: 'Archive',
      delete: 'Delete',
    },
    empty: {
      title: "Let's add your first source",
      description: "Choose how you'd like to bring in knowledge.",
      cards: {
        files: {
          title: 'Upload files',
          desc: 'PDF, DOCX, MD, TXT, HTML (up to 50 MB each).',
        },
        article: {
          title: 'Create an article',
          desc: 'Write knowledge directly in Webex.',
        },
        websites: {
          title: 'Extract from websites',
          desc: 'Crawl public URLs and keep them fresh.',
        },
        sharepoint: {
          title: 'Connect SharePoint',
          desc: 'Sync sites, libraries, and pages from SharePoint Online.',
        },
      },
    },
    sourcesTable: {
      name: 'Source name',
      description: 'Description',
      type: 'Type',
      createdBy: 'Created by',
      updatedBy: 'Last updated by',
      updatedAt: 'Last updated',
      status: 'Status',
      controls: 'Controls',
      syncNow: 'Sync now',
      edit: 'Edit',
      delete: 'Delete',
      searchPlaceholder: 'Search sources',
      filterAll: 'All types',
      filterSharepoint: 'SharePoint',
      filterFiles: 'Files',
      filterArticle: 'Articles',
      filterWebsites: 'Websites',
      emptyFiltered: 'No sources match your filters',
    },
    status: {
      processed: 'Processed',
      syncing: 'Syncing',
      hasIssues: (n: number) => `${n} issue${n === 1 ? '' : 's'}`,
      failed: 'Failed',
      draft: 'Draft',
    },
    usedByTable: {
      title: 'Connected agents',
      emptyTitle: 'No agents are using this collection yet',
      emptyDesc: 'Connect a collection from the Agent configuration page.',
    },
    historyTable: {
      started: 'Started',
      finished: 'Finished',
      mode: 'Mode',
      actions: 'Actions',
      trigger: 'Trigger',
      status: 'Status',
    },
    comingSoonTitle: 'Coming soon',
    comingSoonBody:
      'SharePoint is the only supported source at this time. Files, Articles, and Websites are on the roadmap.',
    notFound: {
      title: 'Collection not found',
      description: 'This collection may have been deleted or the link is incorrect.',
      action: 'Back to Knowledge',
    },
    firstSyncToast: {
      title: 'Source created',
      message:
        'First sync is in progress. We\'ll notify you when indexing is complete.',
    },
  },

  editSourceModal: {
    title: 'Edit source',
    subtitle: 'Update the name and description shown in the sources table.',
    sectionTitle: 'Source details',
    fields: {
      name: 'Source name',
      namePlaceholder: 'Enter a source name',
      description: 'Description',
      descriptionPlaceholder: 'Add a short description for this source.',
    },
    hints: {
      readOnly:
        'Connection, scope, and sync settings are captured when the source is created. To change them, remove the source and add it again.',
    },
    errors: {
      nameRequired: 'Give this source a name.',
      descriptionRequired: 'Add a short description.',
      saveFailedTitle: "Couldn't save changes",
    },
    actions: { cancel: 'Cancel', save: 'Save changes and sync' },
    toast: {
      savedTitle: 'Changes saved',
    },
  },

  sharepointModal: {
    title: 'Add SharePoint',
    subtitle: 'Provide details to connect to your external source.',
    steps: {
      basics: 'Basics',
      scopeAuth: 'Authentication',
      selectFiles: 'Select files',
      syncSettings: 'Sync settings',
    },
    sections: {
      details: 'Source details',
      configuration: 'Source configuration',
      source: 'Source',
      authentication: 'Authentication',
      scope: 'Content scope',
      syncScope: 'Sync scope',
      syncMode: 'Sync mode',
      syncSchedule: 'Sync run schedule',
      limits: 'Limits & quotas',
    },
    fields: {
      name: 'Source name',
      description: 'Description',
      hostingLabel: 'Select your SharePoint data source',
      hostingCardTitle: 'SharePoint Online',
      hostingCardSub: 'Microsoft 365 tenants on sharepoint.com.',
      domain: 'Your domain',
      domainPrefix: 'https://',
      domainPlaceholder: 'contoso.sharepoint.com',
      domainHint:
        'Enter your SharePoint Online tenant domain (contoso.sharepoint.com).',
      domainError:
        'Only SharePoint Online domains are supported (e.g. contoso.sharepoint.com, .sharepoint.us, .sharepointonline.com).',
      siteUrls: 'Site URLs',
      siteUrlsAdd: '+ Add source URLs',
      sitePlaceholder: 'https://contoso.sharepoint.com/sites/support',
      connection: 'Select a connection',
      connectionHint:
        "OAuth 2.0 via Microsoft Entra — credentials are managed by Webex; we never see your password.",
      createConnection: '+ Create new connection',
      contentTypes: 'Content to sync',
      contentTypesHint: 'We index supported SharePoint content types only.',
      entities: 'Selected files and folders',
      entitiesHint:
        'Choose the specific SharePoint files or folders to include in this source.',
      selectedFilesTitle: 'Selected files and folders',
      selectedFilesHint:
        'Review the SharePoint files and folders that will be indexed. Remove anything you do not want to sync, or add more from SharePoint.',
      addMoreFiles: 'Add more',
      selectedName: 'Name',
      selectedType: 'Type',
      selectedLocation: 'Location',
      selectedSize: 'Size',
      selectedActions: 'Actions',
      removeSelected: 'Remove',
      additionalConfig: 'Additional configuration (optional)',
      additionalConfigSub:
        'All content will be indexed by default. However, you can also limit the scope with these additional options.',
      entityRegex: 'Entity regex patterns',
      entityRegexDesc:
        'Add regular expression patterns to include specific entities. You can add up to 100 patterns.',
      entityRegexPlaceholder: '^Shared Documents/.+',
      attachmentRegex: 'Attachment regex patterns',
      attachmentRegexDesc:
        'Add regular expression patterns to include or exclude certain files. You can add up to 100 patterns.',
      attachmentRegexPlaceholder: '.*\\.pdf$',
      addPattern: '+ Add pattern',
      removePattern: 'Remove pattern',
      patternsCount: (n: number) => `${n}/100`,
      includeAcl: 'Include permission metadata for permission-aware retrieval',
      aclHelper:
        "Requires the permission-aware retrieval feature. This is under discussion and may require a feature flag on your tenant.",
      syncMode: {
        incremental: 'Incremental sync',
        incrementalHelp:
          'Syncs new, modified, or deleted content using stable source IDs and modified timestamps.',
        full: 'Full sync',
        fullHelp: 'Re-imports everything in scope on every run.',
      },
      frequency: 'Frequency',
      customIntervalHelp:
        'Pick the days of the week and the time the sync should run in your tenant timezone.',
      firstRunNote: 'First sync runs immediately after save.',
      maxFileSize: 'Max file size',
      maxSources: 'Max sources per collection',
      indexedVolume: 'Indexed volume',
    },
    banners: {
      onlineOnly:
        'SharePoint Server / on-prem is not supported for now. Only SharePoint Online tenants can be connected.',
      quotaExceeded:
        'Adding this connector would exceed the indexed volume quota for this collection. Remove another source or request a quota increase.',
    },
    actions: { cancel: 'Cancel', save: 'Save', back: 'Back', next: 'Next' },
    errors: {
      nameRequired: 'Give this source a name.',
      descriptionRequired: 'Add a short description.',
      domainRequired: 'Enter your SharePoint Online domain.',
      siteUrlsRequired: 'Add at least one site URL.',
      connectionRequired: 'Choose a connection.',
      contentTypesRequired: 'Select at least one content type.',
      entitiesRequired: 'Select at least one file or folder.',
      submitBlockedTitle: "Can't save yet",
      submitBlockedMessage: 'Please fix the highlighted fields and try again.',
    },
  },

  issuesDrawer: {
    title: (source: string) => `Issues for "${source}"`,
    filters: {
      all: 'All',
      unsupported: 'Unsupported type',
      oversize: 'Oversize',
      processing: 'Processing failure',
    },
    table: {
      item: 'Item',
      type: 'Issue type',
      reason: 'Reason',
      detected: 'Detected at',
      action: 'Action',
    },
    actions: {
      retry: 'Retry',
      skip: 'Skip',
    },
    bulk: { retry: 'Retry selected', skip: 'Skip selected' },
    empty: {
      title: 'No issues',
      description: 'Everything is indexed cleanly.',
    },
    viewFullHistory: 'View full history',
  },
} as const;

export type KnowledgeCopy = typeof knowledgeCopy;
