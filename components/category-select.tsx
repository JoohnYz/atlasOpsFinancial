"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { getEmojiFromText, categoryEmojis } from "@/lib/emoji-utils"

interface Category {
  id: string
  name: string
  emoji: string
}

interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function CategorySelect({ value, onChange, label = "Categoría" }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("📦")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, emoji, is_custom")
        .order("name", { ascending: true })

      if (error) throw error

      // Deduplicate by name, prioritizing system categories (is_custom: false)
      const uniqueCategories: Record<string, Category & { is_custom?: boolean }> = {}

      if (data) {
        data.forEach((cat) => {
          const existing = uniqueCategories[cat.name]
          // If not exists OR if existing is custom but new one is system
          if (!existing || (existing.is_custom && !cat.is_custom)) {
            uniqueCategories[cat.name] = cat
          }
        })
      }

      setCategories(Object.values(uniqueCategories))
    } catch (err) {
      console.error("Error loading categories:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name: newCategoryName,
            emoji: selectedEmoji,
            type: "expense",
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setCategories([...categories, data[0]])
        onChange(newCategoryName)
        resetNewCategory()
      }
    } catch (err) {
      console.error("Error adding category:", err)
    }
  }

  const resetNewCategory = () => {
    setNewCategoryName("")
    setSelectedEmoji("📦")
    setIsAddingNew(false)
    setShowEmojiPicker(false)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setNewCategoryName(text)
    // Auto-detect emoji based on text
    if (text.trim()) {
      setSelectedEmoji(getEmojiFromText(text))
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando categorías...</div>
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="category" className="text-foreground">
        {label}
      </Label>

      {!isAddingNew ? (
        <div className="flex gap-2">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="bg-secondary border-border text-foreground">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name} className="text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.emoji || "📦"}</span>
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsAddingNew(true)}
            className="border-border"
            title="Agregar categoría personalizada"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3 p-3 border border-border rounded-lg bg-secondary/30">
          <div className="flex gap-2">
            {/* Emoji Picker Button */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="text-2xl w-12 h-10 p-0 border-border bg-transparent"
                >
                  {selectedEmoji}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-card border-border">
                <div className="grid grid-cols-7 gap-1">
                  {categoryEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`text-xl p-1.5 rounded hover:bg-secondary transition-colors ${selectedEmoji === emoji ? "bg-primary/20 ring-1 ring-primary" : ""
                        }`}
                      onClick={() => {
                        setSelectedEmoji(emoji)
                        setShowEmojiPicker(false)
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Category Name Input */}
            <Input
              autoFocus
              placeholder="Nombre de la categoría..."
              value={newCategoryName}
              onChange={handleNameChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory()
                if (e.key === "Escape") resetNewCategory()
              }}
              className="bg-secondary border-border text-foreground flex-1"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetNewCategory}
              className="border-border bg-transparent"
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddCategory}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!newCategoryName.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
