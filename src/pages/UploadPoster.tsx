import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function UploadPoster() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert("Please select an image");

    // 1️⃣ Upload image to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { error: storageError } = await supabase.storage
      .from("posters")
      .upload(fileName, file);

    if (storageError) {
      alert(storageError.message);
      return;
    }

    const posterUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/posters/${fileName}`;

    // 2️⃣ Insert movie into the DB
    const { error: insertError } = await supabase.from("movies").insert([
      { title, description: desc, category, poster_url: posterUrl },
    ]);

    if (insertError) alert(insertError.message);
    else alert("✅ Movie added!");
  }

  return (
    <main className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Upload New Movie</h1>
      <form onSubmit={handleUpload} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
        >
          Upload
        </button>
      </form>
    </main>
  );
}
