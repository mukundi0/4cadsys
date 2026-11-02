export type CatalogBook={key:string;title:string;author_name?:string[];first_publish_year?:number;cover_i?:number;edition_count?:number;editions?:{docs?:{key:string;ebook_access?:string;isbn_13?:string[]}[]}}
type SearchResponse={docs?:CatalogBook[]}
type ReadResponse={items?:{status?:string;itemURL?:string}[]}
const cacheKey=(q:string)=>`acadsys-openlibrary:${q.toLowerCase()}`
let lastRequestAt=0
function wait(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(new DOMException('Search cancelled','AbortError'));return}const timer=setTimeout(resolve,ms);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Search cancelled','AbortError'))},{once:true})})}
export async function searchOpenLibrary(query:string,signal:AbortSignal):Promise<CatalogBook[]>{
  const q=query.trim();if(q.length<3)return[]
  try{const cached=sessionStorage.getItem(cacheKey(q));if(cached)return JSON.parse(cached) as CatalogBook[]}catch{/* Private browsing can disable session storage. */}
  const delay=Math.max(0,1100-(Date.now()-lastRequestAt));if(delay)await wait(delay,signal)
  const params=new URLSearchParams({q,fields:'key,title,author_name,first_publish_year,cover_i,edition_count,editions,editions.key,editions.ebook_access',limit:'12'})
  lastRequestAt=Date.now()
  const response=await fetch(`https://openlibrary.org/search.json?${params}`,{signal,headers:{Accept:'application/json'}})
  if(!response.ok)throw new Error('Open Library search is temporarily unavailable. Try again shortly.')
  const data=await response.json() as SearchResponse,docs=Array.isArray(data.docs)?data.docs:[]
  try{sessionStorage.setItem(cacheKey(q),JSON.stringify(docs))}catch{/* Search remains usable if caching is unavailable. */}
  return docs
}

const workId=(key:string)=>key.match(/(?:^|\/)works\/(OL\d+W)$|^(OL\d+W)$/)?.slice(1).find(Boolean)||''
const editionId=(key:string)=>key.match(/(?:^|\/)books\/(OL\d+M)$|^(OL\d+M)$/)?.slice(1).find(Boolean)||''

// Open Library's Read API returns a readable or borrowable edition URL. Keep
// reading inside the portal when a provider offers an embeddable reader.
export async function openCatalogBook(book:Pick<CatalogBook,'key'|'editions'> & {editionKey?:string},signal?:AbortSignal):Promise<{url:string;status:string}|null>{
  const editions=book.editions?.docs||[]
  const publicEdition=editions.find(item=>item.ebook_access==='public')
  const edition=editionId(book.editionKey||'')||editionId(publicEdition?.key||'')||editions.map(item=>editionId(item.key)).find(Boolean)||''
  const id=edition||workId(book.key)
  if(!id)return null
  const response=await fetch(`https://openlibrary.org/api/volumes/brief/olid/${id}.json`,{signal,headers:{Accept:'application/json'}})
  if(!response.ok)throw new Error('Open Library could not check this book’s reading options. Try again shortly.')
  const result=await response.json() as ReadResponse
  const item=result.items?.find(candidate=>candidate.itemURL&&['full access','lendable'].includes((candidate.status||'').toLowerCase()))
  if(!item?.itemURL)return null
  const url=new URL(item.itemURL.replace(/^http:/,'https:'))
  const archiveStream=url.hostname.endsWith('archive.org')&&url.pathname.match(/^\/stream\/([^/]+)/)
  if(archiveStream)url.pathname=`/embed/${archiveStream[1]}`
  return {url:url.toString(),status:item.status||'available'}
}
