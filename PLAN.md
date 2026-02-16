# Dorian Studio — תוכנית פיתוח מלאה

## טכנולוגיות
- **Next.js** (App Router) + **TypeScript**
- **Supabase** (PostgreSQL + Auth with Google SSO)
- **shadcn/ui** + **Tailwind CSS** (RTL)
- **@dnd-kit** for Drag & Drop
- **Vercel** deployment
- **UI**: עברית RTL בלבד, פונט Noto Sans Hebrew

---

## שלבי פיתוח

### שלב 1: תשתית (Foundation)
1. אתחול פרויקט Next.js עם TypeScript, Tailwind, ESLint
2. התקנת dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `@dnd-kit/core`, `@dnd-kit/sortable`, `date-fns`
3. הגדרת shadcn/ui במצב RTL (`shadcn init --rtl`) + התקנת קומפוננטות בסיסיות
4. הגדרת Supabase project (Google OAuth provider)
5. יצירת Supabase clients (browser + server + middleware)
6. הגדרת middleware עם auth redirect
7. Auth callback route
8. Root layout: RTL, `lang="he"`, `dir="rtl"`, פונט עברי, DirectionProvider
9. דף login עם Google SSO
10. הרצת SQL מלא ב-Supabase: טבלאות, enums, פונקציות, RLS, triggers
11. Generate TypeScript database types
12. Deploy ל-Vercel + בדיקת OAuth flow

**תוצאה**: משתמש יכול להתחבר עם Google, רואה shell ריק, פרופיל נוצר אוטומטית.

### שלב 2: אזור Admin
1. בניית `(authenticated)/layout.tsx` עם sidebar navigation (shadcn sidebar)
2. Admin authorization guard ב-`admin/layout.tsx`
3. דף רשימת לקוחות (`/admin/clients`) — טבלה + כפתור הוספה
4. טופס לקוח (יצירה/עריכה)
5. דף פרטי לקוח (`/admin/clients/[clientId]`) — אנשי קשר, עריכה
6. טופס איש קשר (הוספה/עריכה/מחיקה)
7. טופס יצירת פרויקט (`/admin/projects/new`) — בחירת לקוח, שם, תיאור, Drive URL
8. דף ניהול צוות (`/admin/projects/[projectId]/members`) — הוספה/הסרה, תפקידים
9. Server actions: createClient, updateClient, createContact, updateContact, deleteContact, createProject, updateProject, addProjectMember, removeProjectMember, updateMemberRole

**תוצאה**: Admin יכול לנהל לקוחות, אנשי קשר, ליצור פרויקטים ולצוות צוות.

### שלב 3: לוח קנבן
1. דף "הפרויקטים שלי" (`/projects`) — גריד כרטיסי פרויקטים
2. דף workspace פרויקט (`/projects/[projectId]`) — קנבן + Now sidebar
3. `KanbanBoard` עם `DndContext` מ-`@dnd-kit/core`
4. `KanbanColumn` עם `SortableContext` מ-`@dnd-kit/sortable`
5. `TaskCard` draggable/sortable עם `useSortable`
6. Drag & Drop handlers:
   - בתוך עמודה (שינוי סדר) → עדכון `order_index`
   - בין עמודות (שינוי סטטוס) → עדכון `status` + `order_index`
7. `TaskCardDialog` לעריכת פרטי משימה
8. `AddTaskForm` inline בתחתית כל עמודה
9. Archive משימה (soft delete)
10. Supabase Realtime subscription על טבלת tasks
11. Optimistic updates ל-drag-and-drop

**תוצאה**: לוח קנבן מלא עם DnD, יצירה/עריכה, סנכרון real-time.

### שלב 4: Now Sidebar + Live Board
1. `NowSidebar` — פאנל ימני (בRTL נראה שמאלי) בדף הפרויקט
2. Now sidebar כ-droppable zone — גרירת TaskCard מקנבן ל-Now
3. `NowItem` — sortable בתוך רשימת Now
4. פעולת "הסרה מ-Now"
5. Server actions: addToNow, removeFromNow, reorderNow
6. דף Live Board (`/now`) — גריד שמציג Now של כל משתמש
7. `UserNowCard` — אווטר, שם, משימות Now שלו
8. Realtime subscription על task_now
9. Visibility cross-project (לוח חי מאגד מכל הפרויקטים המשותפים)

**תוצאה**: משתמשים יכולים לפוקס על משימות דרך Now, צוות רואה מי עובד על מה.

### שלב 5: Calendar + ליטוש
1. דף Calendar (`/projects/[projectId]/calendar`)
2. `EventCalendar` עם shadcn calendar + הצגת אירועים
3. `EventForm` dialog ליצירה/עריכה
4. `EventList` לאירועים קרובים
5. Server actions: createEvent, updateEvent, deleteEvent
6. Loading states, empty states, error boundaries
7. Toast notifications למוטציות
8. Responsive refinements (sidebar collapse למובייל)
9. בדיקת RTL בכל הדפים

**תוצאה**: כל הפיצ'רים מוכנים ומלוטשים.

---

## מבנה תיקיות

```
src/
  app/
    layout.tsx                          # Root: RTL, font, DirectionProvider
    globals.css                         # Tailwind imports, theme
    login/page.tsx                      # Google SSO login
    auth/callback/route.ts              # OAuth callback
    (authenticated)/
      layout.tsx                        # App shell: sidebar + top bar
      projects/
        page.tsx                        # הפרויקטים שלי
        [projectId]/
          page.tsx                      # Kanban + Now sidebar
          calendar/page.tsx             # לוח שנה/אירועים
      admin/
        layout.tsx                      # Admin guard
        clients/
          page.tsx                      # רשימת לקוחות
          [clientId]/page.tsx           # כרטיס לקוח
        projects/
          new/page.tsx                  # יצירת פרויקט
          [projectId]/members/page.tsx  # ניהול צוות
      now/page.tsx                      # Live Board

  components/
    ui/                 # shadcn/ui (auto-generated)
    layout/             # app-sidebar, top-bar, user-nav
    kanban/             # kanban-board, kanban-column, task-card, task-card-dialog, add-task-form
    now/                # now-sidebar, now-item, now-droppable
    live-board/         # live-board-grid, user-now-card
    admin/              # client-form, client-contacts-list, contact-form, project-form, member-manager
    calendar/           # event-calendar, event-form, event-list
    shared/             # loading-spinner, empty-state, confirm-dialog, page-header

  lib/
    supabase/           # client.ts, server.ts, middleware.ts
    actions/            # tasks.ts, projects.ts, clients.ts, members.ts, events.ts, now.ts
    queries/            # projects.ts, tasks.ts, clients.ts, now.ts, live-board.ts
    hooks/              # use-realtime-tasks.ts, use-realtime-now.ts, use-user.ts, use-project-role.ts
    utils/              # order-index.ts, cn.ts, constants.ts

  types/
    database.ts         # Generated Supabase types
    kanban.ts           # Kanban-specific types
    index.ts            # Shared app types

  middleware.ts         # Next.js middleware entry point
```

---

## סכמת בסיס נתונים (Supabase SQL)

### Enums
- `user_role`: admin, staff
- `project_role`: lead, member, viewer
- `task_status`: todo, doing, done, frozen

### טבלאות
1. **profiles** — id (FK auth.users), email, full_name, avatar_url, role, is_active
2. **clients** — id, name, notes, is_active
3. **client_contacts** — id, client_id (FK), name, email, phone, role_title, is_primary
4. **projects** — id, client_id (FK), name, description, google_drive_url, is_archived
5. **project_members** — id, project_id (FK), user_id (FK), role (project_role), phase_id (FK nullable), UNIQUE(project_id, user_id, phase_id)
6. **project_phases** — id, project_id (FK), start_date, end_date, order_index
7. **tasks** — id, project_id (FK), title, description, status (task_status), order_index (FLOAT), assignee_id (FK), is_archived, created_by (FK)
8. **task_now** — id, user_id (FK), task_id (FK), order_index (FLOAT), UNIQUE(user_id, task_id)
9. **project_events** — id, project_id (FK), title, description, event_date, event_time, created_by (FK)
10. **project_notes** — id, project_id (FK), user_id (FK), content, is_private, created_at

### RLS Helper Functions
- `is_admin()` — בודק אם המשתמש הנוכחי admin/staff
- `is_project_member(project_id)` — בודק חברות בפרויקט
- `is_project_lead(project_id)` — בודק אם המשתמש lead בפרויקט
- `user_project_ids()` — מחזיר כל project_id שהמשתמש חבר בהם

### RLS Policies (עיקרים)
- **profiles**: כולם קוראים, עדכון עצמי + admin
- **clients/client_contacts**: admin בלבד
- **projects**: admin רואה הכל, members רואים רק שלהם
- **project_members**: admin + members של הפרויקט קוראים, admin + lead מנהלים
- **project_phases**: admin + members קוראים, admin כותבים
- **tasks**: חברי פרויקט קוראים ומעדכנים
- **task_now**: כל אחד מנהל רק את שלו, צפייה מוגבלת לפרויקטים משותפים
- **project_events**: חברי פרויקט קוראים, lead מנהל
- **project_notes**: משותפות — חברי פרויקט קוראים, אישיות — רק הכותב

### Realtime
- tasks + task_now מוגדרים ל-realtime

---

## החלטות ארכיטקטוניות מרכזיות

1. **Server-first data**: כל הנתונים נטענים ב-Server Components. Client Components רק לאינטראקטיביות
2. **Server Actions למוטציות**: כל הכתיבות דרך `'use server'` actions + `revalidatePath`
3. **Optimistic UI ל-DnD**: קנבן מעדכן state מקומי מיידית, מסנכרן עם שרת ברקע
4. **Fractional indexing**: `order_index` כ-FLOAT נמנע מ-reindex בכל גרירה
5. **RLS עם helper functions**: פונקציות SECURITY DEFINER שומרות על קריאות נקייה
6. **Realtime לשיתוף פעולה**: tasks ו-task_now משתמשים ב-Supabase Realtime
7. **RTL-first עם shadcn**: `--rtl` flag + logical CSS properties (ms/me/start/end)
8. **Route groups להפרדת auth**: `(authenticated)` + `admin/layout.tsx` כשכבת authorization
9. **ללא state management library**: React useState + Context + Server Actions מספיקים
