'use client'

import React from "react"
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold">¡Cuenta creada exitosamente!</h2>
              <p className="text-muted-foreground">
                Tu cuenta ha sido creada. Serás redirigido al inicio de sesión...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">AtlasOps Financial</h1>
                <p className="text-sm text-muted-foreground">Financial Dashboard</p>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Crear cuenta
              </h2>
              <p className="text-muted-foreground">
                Completa los datos para crear tu cuenta
              </p>
            </div>

            {/* Sign Up Form */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repite tu contraseña"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                    <Link href="/auth/login" className="text-slate-900 dark:text-slate-100 font-medium hover:underline">
                      Iniciar sesión
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 items-center justify-center p-8">
        <div className="max-w-md space-y-6 text-center">
          <div className="relative h-32 w-32 mx-auto mb-8">
            <Image
              src="/images/qocudl4nzvcitky1762190700.png"
              alt="AtlasOps Financial"
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Gestión Financiera Empresarial
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
            Control completo de ingresos, gastos, nómina y reportes en un solo lugar
          </p>
        </div>
      </div>
    </div>
  )
}
