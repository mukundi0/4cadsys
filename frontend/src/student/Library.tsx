import { useEffect, useMemo, useState } from 'react'
import { Card, Empty, Notice, PageHead } from '../ui'
import { loadLibraryBooks, loadSavedLibraryBooks, readLibraryBook, removeCatalogBook, saveCatalogBook } from '../studentApi'
import type { LibraryBook, SavedLibraryBook } from '../studentApi'
import { openCatalogBook, searchOpenLibrary } from './openLibrary'
import type { CatalogBook } from './openLibrary'

type Reader = { title:string; url:string; source:string }
type Tab = 'school'|'mine'|'discover'
const sizeLabel=(bytes:number)=>bytes<1024*1024?`${Math.ceil(bytes/1024)} KB`:`${(bytes/1024/1024).toFixed(1)} MB`
const workId=(key:string)=>key.match(/(?:^|\/)works\/(OL\d+W)$|^(OL\d+W)$/)?.slice(1).find(Boolean)||''
const editionId=(key:string)=>key.match(/(?:^|\/)books\/(OL\d+M)$|^(OL\d+M)$/)?.slice(1).find(Boolean)||''
const coverUrl=(id:number|null|undefined,size='M')=>id?`https://covers.openlibrary.org/b/id/${id}-${size}.jpg`:''

export default function Library(){
  const [books,setBooks]=useState<LibraryBook[]>([]),[saved,setSaved]=useState<SavedLibraryBook[]>([])
  const [query,setQuery]=useState(''),[catalogQuery,setCatalogQuery]=useState(''),[catalogBooks,setCatalogBooks]=useState<CatalogBook[]>([])
  const [catalogLoading,setCatalogLoading]=useState(false),[catalogError,setCatalogError]=useState(''),[tab,setTab]=useState<Tab>('school')
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[reader,setReader]=useState<Reader|null>(null),[busy,setBusy]=useState('')

  useEffect(()=>{let live=true;Promise.all([loadLibraryBooks(),loadSavedLibraryBooks()]).then(([schoolBooks,savedBooks])=>{if(live){setBooks(schoolBooks);setSaved(savedBooks)}}).catch(e=>{if(live)setError(e instanceof Error?e.message:'Could not load your library.')});return()=>{live=false}},[])
  useEffect(()=>{if(tab!=='discover')return;const q=catalogQuery.trim();if(q.length<3){setCatalogBooks([]);setCatalogLoading(false);setCatalogError('');return}setCatalogBooks([]);setCatalogLoading(true);const controller=new AbortController(),timer=setTimeout(()=>{setCatalogError('');searchOpenLibrary(q,controller.signal).then(setCatalogBooks).catch(e=>{if(e instanceof Error&&e.name!=='AbortError')setCatalogError(e.message)}).finally(()=>{if(!controller.signal.aborted)setCatalogLoading(false)})},500);return()=>{clearTimeout(timer);controller.abort()}},[catalogQuery,tab])

  const visible=useMemo(()=>{const q=query.trim().toLowerCase();return books.filter(b=>!q||[b.title,b.author,b.subject,b.description].some(x=>x?.toLowerCase().includes(q)))},[books,query])
  const savedKeys=useMemo(()=>new Set(saved.map(b=>b.workKey)),[saved])
  const visibleSaved=useMemo(()=>{const q=query.trim().toLowerCase();return saved.filter(b=>!q||[b.title,b.author].some(x=>x?.toLowerCase().includes(q)))},[saved,query])

  async function openSchoolBook(book:LibraryBook){setBusy(book.id);setError('');try{const result=await readLibraryBook(book.id);setReader({title:book.title,url:result.url,source:'School library PDF'})}catch(e){setError(e instanceof Error?e.message:'Could not open this book.')}finally{setBusy('')}}
  async function openCatalog(book:CatalogBook|SavedLibraryBook){const id='workKey'in book?book.workKey:workId(book.key);setBusy(id);setError('');try{const result=await openCatalogBook('workKey'in book?{key:book.workKey,editionKey:book.editionKey}:{key:book.key,editions:book.editions});if(!result){setNotice('Open Library does not currently offer an in-browser reading copy for this title. You can still keep it on your shelf and check its reading options on Open Library.');return}setReader({title:book.title,url:result.url,source:`Open Library · ${result.status}`})}catch(e){setError(e instanceof Error?e.message:'Could not open this book.')}finally{setBusy('')}}
  async function save(book:CatalogBook){const workKey=workId(book.key);if(!workKey)return;setBusy(workKey);setError('');setNotice('');try{const editions=book.editions?.docs||[],preferred=editions.find(x=>x.ebook_access==='public')||editions[0],editionKey=editionId(preferred?.key||'');await saveCatalogBook({workKey,editionKey,title:book.title,author:book.author_name?.join(', ')||'',coverId:book.cover_i||null});setSaved(await loadSavedLibraryBooks());setNotice('Saved to My Library.')}catch(e){setError(e instanceof Error?e.message:'Could not save this book.')}finally{setBusy('')}}
  async function remove(book:SavedLibraryBook){setBusy(book.workKey);setError('');try{await removeCatalogBook(book.workKey);setSaved(await loadSavedLibraryBooks());setNotice('Removed from My Library.')}catch(e){setError(e instanceof Error?e.message:'Could not remove this book.')}finally{setBusy('')}}

  return <>
    <PageHead eyebrow="Read and learn" title="School library" sub="Read school PDFs in the portal and keep Open Library titles on your own shelf." />
    {error&&<Notice onDismiss={()=>setError('')}>{error}</Notice>}{notice&&<Notice tone="info" onDismiss={()=>setNotice('')}>{notice}</Notice>}
    <div className="row wrap" role="tablist" aria-label="Library collection">
      <button className={tab==='school'?'btn':'btn secondary'} role="tab" aria-selected={tab==='school'} onClick={()=>setTab('school')}>School books</button>
      <button className={tab==='mine'?'btn':'btn secondary'} role="tab" aria-selected={tab==='mine'} onClick={()=>setTab('mine')}>My Library{saved.length?` (${saved.length})`:''}</button>
      <button className={tab==='discover'?'btn':'btn secondary'} role="tab" aria-selected={tab==='discover'} onClick={()=>setTab('discover')}>Discover books</button>
    </div>
    {tab==='school'&&<>
      <label className="field" style={{maxWidth:440}}>Search school books<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Title, author or subject" /></label>
      <div className="grid g-3">{visible.length?visible.map(book=><Card key={book.id}><span className="card-label">{book.subject||'Reading'}</span><h2 style={{fontSize:22,letterSpacing:'-.02em'}}>{book.title}</h2><p className="muted">{book.author?`By ${book.author} · `:''}{book.class_level||'All classes'} · {sizeLabel(book.file_size)}</p>{book.description&&<p>{book.description}</p>}<button className="btn" disabled={busy===book.id} onClick={()=>void openSchoolBook(book)}>{busy===book.id?'Opening…':'Read PDF now'}</button></Card>):<Card><Empty title={query?'No matching books':'The library is ready for books'} body={query?'Try a different title, author or subject.':'Your teachers’ published books will appear here.'} /></Card>}</div>
    </>}
    {tab==='mine'&&<>
      <label className="field" style={{maxWidth:440}}>Search My Library<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Title or author" /></label>
      <div className="grid g-3">{visibleSaved.length?visibleSaved.map(book=><Card key={book.workKey}><div className="row" style={{alignItems:'flex-start',gap:14}}>{book.coverId&&<img src={coverUrl(book.coverId)} alt="" loading="lazy" style={{width:76,maxHeight:116,objectFit:'cover',borderRadius:6,background:'var(--rule-soft)'}} />}<div className="stack" style={{gap:7}}><span className="card-label">Saved to your shelf</span><h2 style={{fontSize:20,letterSpacing:'-.02em'}}>{book.title}</h2><p className="muted">{book.author||'Author not listed'}</p></div></div><div className="row wrap"><button className="btn" disabled={busy===book.workKey} onClick={()=>void openCatalog(book)}>{busy===book.workKey?'Opening…':'Read in portal'}</button><button className="btn secondary" disabled={busy===book.workKey} onClick={()=>void remove(book)}>Remove</button><a className="btn secondary" href={`https://openlibrary.org/works/${book.workKey}`} target="_blank" rel="noreferrer">Book details</a></div></Card>):<Card><Empty title={query?'No matching saved books':'Your shelf is empty'} body={query?'Try another title or author.':'Discover a title and save it here for quick access later.'} /></Card>}</div>
    </>}
    {tab==='discover'&&<>
      <label className="field" style={{maxWidth:520}}>Search Open Library<input type="search" value={catalogQuery} onChange={e=>setCatalogQuery(e.target.value)} placeholder="Search title, author or topic" /><span className="muted">Search the catalog, save titles to My Library, and read available copies here.</span></label>
      {catalogError&&<Notice onDismiss={()=>setCatalogError('')}>{catalogError}</Notice>}{catalogLoading&&<p className="muted" role="status">Searching Open Library…</p>}
      {catalogQuery.trim().length<3?<Card><Empty title="Find your next book" body="Enter at least 3 characters to search the catalog." /></Card>:!catalogLoading&&!catalogBooks.length&&!catalogError?<Card><Empty title="No books found" body="Try a shorter title, another spelling or an author name." /></Card>:<div className="grid g-3">{catalogBooks.map(book=>{const id=workId(book.key),isSaved=savedKeys.has(id);return <Card key={book.key}><div className="row" style={{alignItems:'flex-start',gap:14}}>{book.cover_i&&<img src={coverUrl(book.cover_i)} alt="" loading="lazy" style={{width:76,maxHeight:116,objectFit:'cover',borderRadius:6,background:'var(--rule-soft)'}} />}<div className="stack" style={{gap:7}}><span className="card-label">Open Library</span><h2 style={{fontSize:20,letterSpacing:'-.02em'}}>{book.title}</h2><p className="muted">{book.author_name?.join(', ')||'Author not listed'}{book.first_publish_year?` · ${book.first_publish_year}`:''}</p>{book.edition_count&&<p className="muted">{book.edition_count} editions listed</p>}</div></div><div className="row wrap"><button className="btn" disabled={!id||busy===id} onClick={()=>void openCatalog(book)}>{busy===id?'Opening…':'Read available copy'}</button>{isSaved?<button className="btn secondary" disabled={busy===id} onClick={()=>{const match=saved.find(x=>x.workKey===id);if(match)void remove(match)}}>Saved · Remove</button>:<button className="btn secondary" disabled={!id||busy===id} onClick={()=>void save(book)}>Save to My Library</button>}<a className="btn secondary" href={`https://openlibrary.org${book.key.startsWith('/')?book.key:`/works/${book.key}`}`} target="_blank" rel="noreferrer">More options</a></div></Card>})}</div>}
      <p className="muted">Catalog and reader availability are provided by <a href="https://openlibrary.org/developers/api" target="_blank" rel="noreferrer">Open Library</a>. Some titles require borrowing or have no online copy.</p>
    </>}
    {reader&&<div className="modal-backdrop" role="presentation" onClick={()=>setReader(null)}><section className="card modal" role="dialog" aria-modal="true" aria-label={`Reading ${reader.title}`} onClick={e=>e.stopPropagation()} style={{width:'min(1100px,98vw)',height:'min(94vh,1000px)',display:'flex',flexDirection:'column'}}><div className="row between wrap"><div><span className="card-label">{reader.source}</span><h2>{reader.title}</h2></div><button className="btn secondary sm" onClick={()=>setReader(null)}>Close reader</button></div><iframe title={`Book: ${reader.title}`} src={reader.url} allow="fullscreen" style={{flex:1,width:'100%',border:'1px solid var(--rule)',borderRadius:8,marginTop:12}} /></section></div>}
  </>
}
