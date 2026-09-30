# Arquitectura del Sistema — Palm ERP Core

> Este documento define el estándar arquitectónico y de calidad de Palm. Los revisores evalúan el código basándose en estas directrices.

## 1. Principios del Núcleo (Core)

1. **Agnóstico al Dominio**: El núcleo de Palm no conoce nada de restaurantes, reservas de Gastroshows ni entrenamientos de Sport2Live. Contiene únicamente las abstracciones horizontales de negocio:
   - Gestión de usuarios y credenciales (Auth).
   - Gestión de fichas de clientes/empresas (CRM central).
   - Ajustes del ERP y gestor de módulos.
   - Auditoría y logs de correo.

2. **Modularidad Estricta (Alternativa B)**:
   - Todo código específico de un vertical (ej. reservas, alérgenos, pasarelas de pago) reside dentro de la carpeta `src/modules/<modulo>/`.
   - El Core no importa código de los módulos. Son los módulos los que se registran a sí mismos en el Core mediante archivos de configuración estándar (`module.ts`).
   - El menú lateral (Sidebar) carga dinámicamente sus items consultando qué módulos están activos en la tabla de configuración.

3. **Despliegue Aislado (Instancia por Cliente) con Multi-Empresa (Prisma):**
    - **Arquitectura de Despliegue**: Cada cliente tiene **su propio repositorio** (un clon/fork de este Core), su propio proyecto en Vercel, y su propia base de datos Supabase independiente. NO es un SaaS global.
    - **El campo `tenantId` (Multi-Empresa)**: Aunque la base de datos es dedicada para un solo cliente, mantenemos la estructura `tenantId` (asociada al modelo `Tenant`) para permitir que **un mismo cliente gestione múltiples empresas, sucursales o unidades de negocio** dentro de su aplicación.
    - Los modelos del Core en `prisma/schema.prisma` son:
      - `Tenant`: Representa una Empresa / Sucursal del cliente (ej. "Tienda Centro", "Tienda Norte").
      - `User`: Administradores y staff (aislados por Empresa/Sucursal).
      - `Contact`: Personas o empresas (aisladas por Empresa).
      - `Setting`: Parámetros clave-valor (aislados por Empresa).
      - `AuditLog`: Registro de operaciones.

---

## 2. Flujo de Datos Modular

```text
                               ┌────────────────────────┐
                               │   Vistas del Core UI   │
                               │ (AdminLayout, Sidebar) │
                               └───────────┬────────────┘
                                           │
                        ¿Qué módulos están habilitados en Setting?
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │  Cargador Dinámico de Módulos (Core)   │
                       │     (src/modules/registry.ts)          │
                       └───────────┬───────────────────┬────────┘
                                   │                   │
                                   ▼                   ▼
                           ┌──────────────┐     ┌──────────────┐
                           │   Módulo 1   │     │   Módulo 2   │
                           │ (Bookings)   │     │   (CMS UI)   │
                           └──────────────┘     └──────────────┘
```

---

## 3. Infraestructura y Despliegue Aislado

```
Request → Vercel (Dominio del Cliente) → middleware.ts (extrae contexto de sucursal si aplica)
        → Prisma singleton → Supabase (DB Dedicada)
```

- Cada cliente tiene su propio entorno (variables de entorno, base de datos).
- La lógica de `tenant_id` sirve exclusivamente para segmentar los datos de las distintas sucursales/empresas de **ese mismo cliente**. No hay mezcla de datos entre diferentes clientes, ya que las bases de datos son físicamente distintas.

## 4. Qué NO hacer

- ❌ **No importes** tipos o componentes de `/src/modules/` en carpetas comunes de `/src/components/` o `/src/core/`. El Core debe compilar y ejecutarse al 100% incluso si vacías la carpeta `/src/modules/`.
- ❌ **No ensucies** el esquema de Prisma con tablas específicas de restaurante a nivel del Core. Si se requieren tablas específicas de un módulo en Prisma, se diseñarán dentro del esquema pero agrupadas y comentadas, o se inyectarán de manera aislada.
- ❌ **No utilices** blanco puro (`#FFFFFF`) ni negro puro (`#000000`) en la interfaz. Aunque usemos Tailwind CSS v4 con una paleta neutra premium corporativa, respetaremos las escalas cromáticas suaves en modo oscuro y claro para que la aplicación se sienta premium.
- ❌ **No crees lógicas Multi-Cliente globales**. Este sistema opera asumiendo que es dueño absoluto de su base de datos.
- ❌ **No asumas que `Tenant` es un cliente de SaaS**. `Tenant` es una "Empresa" o "Sucursal" dentro de la corporación del cliente dueño de esta instancia.
