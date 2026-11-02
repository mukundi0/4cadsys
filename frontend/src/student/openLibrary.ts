export type CatalogBook={key:string;title:string;author_name?:string[];first_publish_year?:number;cover_i?:number;edition_count?:number}
type SearchResponse={docs?:CatalogBook[]}
const cacheKey=(q:string)=>`acadsys-openlibrary:${q.toLowerCase()}`
let lastRequestAt=0
function wait(ms:number,signal:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(new DOMException('Search cancelled','AbortError'));return}const timer=setTimeout(resolve,ms);signal.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Search cancelled','AbortError'))},{once:true})})}
export async function searchOpenLibrary(query:string,signal:AbortSignal):Promise<CatalogBook[]>{
  const q=query.trim();if(q.length<3)return[]
  try{const cached=sessionStorage.getItem(cacheKey(q));if(cached)return JSON.parse(cached) as CatalogBook[]}catch{/* Private browsing can disable session storage. */}
  const delay=Math.max(0,1100-(Date.now()-lastRequestAt));if(delay)await wait(delay,signal)
  const params=new URLSearchParams({q,fields:'key,title,author_name,first_publish_year,cover_i,edition_count',limit:'12'})
  lastRequestAt=Date.now()
  const response=await fetch(`https://openlibrary.org/search.json?${params}`,{signal,headers:{Accept:'application/json'}})
  if(!response.ok)throw new Error('Open Library search is temporarily unavailable. Try again shortly.')
  const data=await response.json() as SearchResponse,docs=Array.isArray(data.docs)?data.docs:[]
  try{sessionStorage.setItem(cacheKey(q),JSON.stringify(docs))}catch{/* Search remains usable if caching is unavailable. */}
  return docs
}
