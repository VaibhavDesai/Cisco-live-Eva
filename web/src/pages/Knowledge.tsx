import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/shared/Button';
import Dropdown from '../components/shared/Dropdown';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/shared/Table';
import { Card } from '../components/shared/Card';
import Tabs, { Tab, TabPanel } from '../components/shared/Tabs';
import Spinner from '../components/shared/Spinner';
import { EmptyState } from '../components/shared/EmptyState';
import { ToggleTip } from '../components/shared/Tooltip';
import { MenuItem, MenuOverlay, useMenu } from '../components/shared/Menu';
import SearchField from '../components/shared/SearchField';
import Toolbar from '../components/shared/Toolbar';
import Badge from '../components/shared/Badge';
import { Icon } from '../icons';
import {
  type Collection,
  type KnowledgeSource,
  listAllSources,
  listCollections,
} from '../services/knowledgeService';
import { knowledgeCopy } from './knowledge/copy';
import { formatRelative } from './knowledge/utils';

const cp = knowledgeCopy.page;

export default function Knowledge() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'collection' | 'sources'>('collection');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allSources, setAllSources] = useState<KnowledgeSource[]>([]);
  const [query, setQuery] = useState('');
  const [usedByFilter, setUsedByFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  /* Initial-fetch gate. Without this the collection tab briefly renders the
     empty-state illustration on every navigation in (because
     `collections.length === 0` is true by definition before the first
     `listCollections()` resolves), then flips to the populated grid — a
     ~1s flash that reads as a bug. Gating on `loading` lets us show a
     neutral spinner until we actually know whether there are any
     collections to render. */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCollections(), listAllSources()])
      .then(([cs, ss]) => {
        if (cancelled) return;
        setCollections(cs);
        setAllSources(ss);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const agents = useMemo(() => {
    const set = new Set<string>();
    collections.forEach((c) => c.usedBy.forEach((a) => set.add(a)));
    return Array.from(set);
  }, [collections]);

  const usedByOptions = useMemo(
    () => [
      { value: 'all', label: cp.usedByAll },
      ...agents.map((a) => ({ value: a, label: a })),
    ],
    [agents],
  );

  const filteredCollections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return collections.filter((c) => {
      if (needle && !c.name.toLowerCase().includes(needle) && !c.description.toLowerCase().includes(needle)) {
        return false;
      }
      if (usedByFilter !== 'all' && !c.usedBy.includes(usedByFilter)) return false;
      return true;
    });
  }, [collections, query, usedByFilter]);

  const filteredSources = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allSources.filter((s) => {
      if (needle && !s.name.toLowerCase().includes(needle)) return false;
      if (usedByFilter !== 'all') {
        const col = collections.find((c) => c.id === s.collectionId);
        if (!col?.usedBy.includes(usedByFilter)) return false;
      }
      return true;
    });
  }, [allSources, collections, query, usedByFilter]);

  // Placeholder for the future "create collection" modal. Wired up to the
  // button as a no-op so reviewers don't accidentally navigate into the first
  // collection when clicking the primary CTA on this page.
  const handleCreateCollection = () => {};

  return (
    <div className="primary-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-x-small)' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            {cp.title}
          </h1>
          <ToggleTip content={cp.infoTip}>
            <button
              type="button"
              aria-label="About collections"
              style={{
                background: 'transparent',
                border: 0,
                padding: 4,
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <Icon name="info-circle" weight="bold" size="sm" />
            </button>
          </ToggleTip>
        </div>
      </div>

      <Tabs aria-label={cp.title}>
        <Tab active={tab === 'collection'} onClick={() => setTab('collection')}>
          {cp.tabs.collection}
        </Tab>
        <Tab active={tab === 'sources'} onClick={() => setTab('sources')}>
          {cp.tabs.sources}
        </Tab>
      </Tabs>

      <div className="knowledge-filter-bar">
        <div className="knowledge-filter-bar__search">
          <SearchField
            placeholder={cp.search}
            value={query}
            onChange={setQuery}
          />
        </div>
        <Dropdown
          options={usedByOptions}
          value={usedByFilter}
          onChange={setUsedByFilter}
          size="compact"
          placeholder={cp.usedByAll}
        />
        <div className="knowledge-filter-bar__spacer" />
        <Toolbar.ButtonGroup size="standard">
          <Toolbar.IconButton
            icon="apps-bold"
            label={cp.view.grid}
            selected={view === 'grid'}
            onClick={() => setView('grid')}
          />
          <Toolbar.IconButton
            icon="view-list-bold"
            label={cp.view.list}
            selected={view === 'list'}
            onClick={() => setView('list')}
          />
        </Toolbar.ButtonGroup>
        <Button size="sm" onClick={handleCreateCollection}>{cp.create}</Button>
      </div>

      <TabPanel>
        {loading ? (
          <div
            className="knowledge-loading"
            role="status"
            aria-live="polite"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--spacing-xx-large) 0',
            }}
          >
            <Spinner size="midsize" aria-label="Loading knowledge" />
          </div>
        ) : (
          <>
        {tab === 'collection' && (
          collections.length === 0 ? (
            <EmptyState
              illustration="message-activity"
              title={knowledgeCopy.landing.emptyTitle}
              description={knowledgeCopy.landing.emptyDescription}
              actions={<Button onClick={handleCreateCollection}>{cp.create}</Button>}
            />
          ) : view === 'grid' ? (
            <div className="collection-grid">
              {filteredCollections.map((c) => (
                <CollectionCard key={c.id} collection={c} onOpen={() => navigate(`/knowledge/${c.id}`)} />
              ))}
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>Sources</TableHeader>
                  <TableHeader>Used by</TableHeader>
                  <TableHeader>Last updated</TableHeader>
                  <TableHeader>Controls</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCollections.map((c) => (
                  <TableRow key={c.id} onClick={() => navigate(`/knowledge/${c.id}`)} style={{ cursor: 'pointer' }}>
                    <TableCell>
                      <strong>{c.name}</strong>
                    </TableCell>
                    <TableCell style={{ maxWidth: 280, whiteSpace: 'normal' }}>
                      {c.description}
                    </TableCell>
                    <TableCell>{c.sourceCount}</TableCell>
                    <TableCell>{c.usedBy.length || '—'}</TableCell>
                    <TableCell>{formatRelative(c.updatedAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/knowledge/${c.id}`);
                        }}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}

        {tab === 'sources' && (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Source</TableHeader>
                <TableHeader>Collection</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Last sync</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody empty={filteredSources.length === 0}>
              {filteredSources.map((s) => {
                const col = collections.find((c) => c.id === s.collectionId);
                return (
                  <TableRow
                    key={s.id}
                    onClick={() => col && navigate(`/knowledge/${col.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="folder" weight="bold" size="sm" />
                        <strong>{s.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell>{col?.name ?? '—'}</TableCell>
                    <TableCell style={{ textTransform: 'capitalize' }}>{s.type}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'processed' ? 'success' : s.status === 'failed' ? 'error' : s.status === 'has_issues' ? 'warning' : 'info'}>
                        {s.status === 'has_issues'
                          ? `${s.issueCount} issue${s.issueCount === 1 ? '' : 's'}`
                          : s.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatRelative(s.lastSyncAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
          </>
        )}
      </TabPanel>
    </div>
  );
}

/* ── Collection card with overflow menu ───────────────────────── */

function CollectionCard({ collection, onOpen }: { collection: Collection; onOpen: () => void }) {
  const { open, anchorRef, toggle, close } = useMenu();

  return (
    <Card clickable className="collection-card" onClick={onOpen}>
      <div className="collection-card__head">
        <div className="collection-card__title-row">
          <span className="collection-card__icon" aria-hidden="true">
            <Icon name="folder" size="sm" />
          </span>
          <h3 className="collection-card__title">{collection.name}</h3>
        </div>
        <button
          ref={anchorRef as React.RefObject<HTMLButtonElement>}
          type="button"
          aria-label="Collection actions"
          className="collection-card__menu-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          <Icon name="more-adr" weight="bold" size="sm" />
        </button>
        <MenuOverlay open={open} anchorRef={anchorRef} onClose={close} align="right">
          <MenuItem label={knowledgeCopy.landing.cardMenu.rename} icon="edit" />
          <MenuItem label={knowledgeCopy.landing.cardMenu.duplicate} icon="copy" />
          <MenuItem label={knowledgeCopy.landing.cardMenu.delete} icon="delete" danger />
        </MenuOverlay>
      </div>
      <p className="collection-card__sub">
        {knowledgeCopy.landing.cardSourcesLabel(collection.sourceCount)}
      </p>
      <p className="collection-card__desc">{collection.description}</p>
    </Card>
  );
}
