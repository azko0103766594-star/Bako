import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 🔹 CONFIGURATION SUPABASE
const supabaseUrl = 'https://TON-PROJET.supabase.co'  // Remplace TON-PROJET
const supabaseKey = 'sb_publishable_ldk7IfzWsJyK1RMaVDl4wg_ibuvoPjz'
const supabase = createClient(supabaseUrl, supabaseKey)

// 🔹 Éléments DOM
const feed = document.getElementById('feed')
const fileInput = document.getElementById('fileInput')
const publishBtn = document.getElementById('publish')
const refreshBtn = document.getElementById('refresh')

// 🔹 Variables
const bucketName = 'mini-bako'  // Vérifie que ton bucket existe et est public

// 🔹 Charger les posts
async function loadPosts() {
  feed.innerHTML = '<p>Chargement...</p>'
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    feed.innerHTML = `<p>Erreur: ${error.message}</p>`
    return
  }

  feed.innerHTML = ''
  data.forEach(post => {
    const div = document.createElement('div')
    div.className = 'post'
    div.innerHTML = `<img src="${post.url}" style="width:100%; border-radius:10px">`
    feed.appendChild(div)
  })
}

// 🔹 Publier un fichier
async function publishPost() {
  if (!fileInput.files.length) return alert('Sélectionne un fichier !')
  
  const file = fileInput.files[0]
  const fileName = `${Date.now()}-${file.name}`

  // 🔹 Upload dans Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file)

  if (error) return alert('Erreur upload: ' + error.message)

  // 🔹 Récupérer l’URL publique
  const { publicUrl, error: urlError } = supabase
    .storage.from(bucketName)
    .getPublicUrl(fileName)

  if (urlError) return alert('Erreur URL: ' + urlError.message)

  // 🔹 Ajouter dans la table posts
  const { error: insertError } = await supabase
    .from('posts')
    .insert([{ url: publicUrl }])

  if (insertError) return alert('Erreur table: ' + insertError.message)

  fileInput.value = ''
  loadPosts()
}

// 🔹 Événements
publishBtn.addEventListener('click', publishPost)
refreshBtn.addEventListener('click', loadPosts)

// 🔹 Initialisation
loadPosts()
