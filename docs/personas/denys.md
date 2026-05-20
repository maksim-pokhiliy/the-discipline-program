# Coach Denys — primary persona / product owner

> Этот документ — **POV-линза** для UI/UX решений. Не "кто-то типа тренера", а **конкретный заказчик**, для которого построен `the-discipline-program`. При оценке любой фичи / поля / экрана мысленно симулируй его daily workflow.
>
> Документ **живой**: разделы Identity / Background стабильны, разделы Decisions log / Open questions / Gaps растут со временем по мере реальных разговоров с Денисом.

---

## 0. Project framing (читать первым)

- **Это tool-for-friend, не market SaaS.** Юзер (Максим) делает инструмент для **друга** (Дениса) — single-tenant продукт. Работа идёт ~3 года, сейчас «свет в конце тоннеля»
- **Decisions arbiter = Денис.** Все продукт-trade-offs проходят через "удобно Денису", не через usability research / personas / market research. Юзер — implementer + sparring partner; Денис — founder + методология + контент
- **Денис = founder + автор методологии + главный тренер + наставник для атлетов.** Не "клиент с фидбеком", а **источник product mental model**
- Multi-tenancy / public signup / discoverability — **далёкое будущее**, если вообще

## 1. Identity

|                |                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Имена в сети   | **Denys Linetskiy** (он же Denis Linetskiy / Денис Линецкий / Денис Линецький) + **Denys Sergeev** — два бренда / handle, один человек |
| Возраст        | 35–40 (приблизительно)                                                                                                                 |
| Родом          | Кременчуг, Полтавская область                                                                                                          |
| Сейчас         | Львов (релокейт ~2023)                                                                                                                 |
| Текущий зал    | «Бруклин», Львов _(требует verify spelling/locator)_                                                                                   |
| Бренд продукта | **The Discipline Program** — namesake этого репозитория                                                                                |
| Motto бренда   | _"Your DISCIPLINE dictates your SUCCESS"_ — это его философия, не маркетинговый слоган                                                 |

### Online presence (верифицированно)

- **Instagram @the_discipline_program** — Coach Denys, ~11K followers. Bio: _"Diploma from Wingate Sport Institute 🇮🇱 · CrossFit | Weightlifting | Adaptive CrossFit · Your DISCIPLINE dictates your SUCCESS"_
- **Instagram @denis\_\_sergeev** — личный handle "Coach & Athlete", мульти-спортсмен (барбель + плавание + бег + вело + лыжи по эмодзи bio)
- Прошлый зал: фитнес-клуб «Тонус», Кременчуг, ул. Первомайская 46А (ТЦ New) — был указан как тренер CrossFit / бега / тяжёлой атлетики на up4sport.com (~12–13 лет опыта = с ~2013)

## 2. Спортивный бэкграунд (athlete-side)

- **KyivBattle 2018** — категория Amateur, этап #1, 275 повторений
- **Dog Autumn Showdown 2019** — **категория Elite** (топ-tier украинской CrossFit-сцены): WOD #1 deadlift 90 kg + strict HSPU, 25 reps за 1:48 (6-минутный cap)
- Траектория Amateur → Elite за один сезон = серьёзный соревнующийся, не "коммерческий зальный тренер"
- Мульти-модальный сам: барбель + endurance (run/swim/bike) + зимний спорт

## 3. Тренерский бэкграунд

- **Образование:** Zinman College of Physical Education and Sport Sciences (Wingate Institute, Netanya, Израиль) — **полная степень**, несколько лет обучения. Триггер обучения — позвал отец, предложил помощь
- **Опыт:** ~12+ лет coaching
- **Стек дисциплин** (всё в одном тренерском портфеле):
  - Тяжёлая атлетика (ТА)
  - Бодибилдинг (ББ)
  - Функциональный/фитнес-бодибилдинг (ФББ)
  - CrossFit
  - Лёгкая атлетика
  - **Реабилитация** (после травм + **военные после ранений**)
  - **Подготовка элитных спортсменов** (включая олимпийцев)

## 4. Operations / scale

|                      |                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------ |
| Volume атлетов       | **>100 одновременно**                                                                |
| Mode                 | **Гибрид** очно + онлайн (распределение точно неизвестно)                            |
| Team                 | **В основном один** — соло-coach                                                     |
| Pricing              | **Гибрид** — групповые подписки + персональный design + специализированные программы |
| Язык клиентов        | RU / UA / EN mix, точное распределение неизвестно                                    |
| Mix соревновательных | ~10% peak'ает к стартам, ~90% general fitness / sport-specific                       |

## 5. Core founder principles (load-bearing для всех product decisions)

### 5.1. «Тренировочный план как поезд» — central domain metaphor

Денисова собственная модель, прямая цитата:

> _"На поезд может сесть один пассажир, а может набиться битком, поезд просто продолжает ехать. Нужна персональная программа — на рельсы выходит новый поезд."_

Что это значит для домена и UX:

- **План = train с собственным расписанием.** Существует независимо от количества атлетов в нём
- **Athletes = passengers.** Подписываются → садятся; нет оплаты → сходят; вернулись → садятся обратно (но **не back-in-time**)
- **Поезд не ждёт.** Тренировки идут по расписанию. Если атлет пропустил день — этот день **уехал**, второго захода нет
- **«Хочу повторить пропущенный день» = anti-pattern.** Денис явно злится на этот запрос. Система должна **отказывать** в make-up sessions, не предоставлять их
- **Персональная программа = новый поезд** (новый Plan instance, не fork существующего)

### 5.2. Подписка ↔ план-как-поезд coupling

Subscription model родилась **именно** из этой метафоры:

- Платишь — едешь
- Не платишь — сходишь
- Не «купи 10 тренировок и используй когда хочешь» (это ломает train metaphor)

### 5.3. Authoritative coach, не negotiator

- Денис **злится** на споры с его методиками
- Программа = его дизайн, не consensus с атлетом
- UX должен reinforce coach authority, не "make athlete feel heard" в каждом нюансе
- Athlete может _ask_ для модификации (травма, readiness), но decision — coach

### 5.4. «Собирать как конструкцию, не писать как сочинение»

Прямая цитата про его текущий pain — нынешний tooling (Excel) заставляет писать **планы как text-сочинения**. Его mental model — **конструкция из готовых блоков**: archetype + параметры + загрузка. Отсюда:

- Архетипы в domain model — не engineering elegance, а **прямой ответ на coach pain** ("писать EMOM по 200 раз в неделю")
- UI должен быть **constructive editor** (drag/click/select), не **text editor** (write prose)
- Repetitive operations (повторить блок, скопировать день, шаблон сессии) — first-class actions

## 6. POV checklist — обязательная линза для UX-решений

Перед тем как одобрить новый экран / поле / flow — пройди эти вопросы **с его лица**:

1. **Daily volume на >100 атлетов** — _Сколько кликов / экранов нужно чтобы обработать 30+ пассажиров в день?_ Если фича one-by-one без batch — это блокер. Соло-coach + >100 атлетов = batch first-class
2. **Train coherence** — _Эта фича сохраняет метафору поезда?_ Make-up sessions, time-travel, "повторить вчерашний день для одного атлета" — anti-patterns
3. **Constructive, не narrative** — _Coach собирает план кликами или печатает прозой?_ Если текст — это шаг назад от Excel. Должен быть constructor
4. **Multi-discipline switching** — он работает с ТА / ББ / ФББ / CF / реабилитацией / олимпийцами одновременно. _Могу ли я быстро переключить контекст между разными типами планов?_
5. **Multi-modal сессия** — одна тренировка `strength → gymnastics → metcon`. _Собирается в одном экране без переключения контекста?_
6. **Adaptive / scaling** — реальные категории: post-injury + **военные после ранений** + возрастные + реабилитация. Не abstract PWD. _UI задаёт modifications без дублирования сессии?_
7. **Periodization, не daily WOD** — _Видна неделя / блок (4–12 недель) / цикл?_ Только день = calendar app, не coaching tool
8. **Readiness + RPE на лету** — атлет приходит на 6/10. _Скейлю план без переписывания недели?_ (cross-ref [[skip-lights-start]])
9. **Async coaching** — он в Telegram, не на gym floor для большинства атлетов. _Cue / video / коррекция доставляются вне сессии в контексте конкретного movement?_
10. **War-era realism** — нет зала / тревога / отключение света. _План тихо переходит на home/basic-kit substitution без потери continuity?_
11. **Authoritative tone** — _UI reinforces coach decision или просит athlete confirm?_ Денис decides; athlete executes (с правом ask на modification)
12. **Discipline-as-philosophy** — _Streaks / consistency / accountability сделаны серьёзно?_ Это его философия, не badge-spam. Не trivialize
13. **Coach-as-competitor** — peaking/tapering — operating manual, не edge-feature
14. **Wingate-академичность** — _Логика построения сессии прозрачна или магия?_ Multi-летняя degree → он мыслит структурно

## 7. Implications для domain модели (engineering side)

| Аспект              | Decision                                                                                           | Почему                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Plan lifecycle      | Train metaphor: plan runs по timetable, athletes subscribe/unsubscribe не back-in-time             | §5.1 — Denys quote                                      |
| Subscription        | Tied to plan-as-train, не credit-pack                                                              | §5.2                                                    |
| Session             | Multi-modal first-class (strength + gymnastics + monostructural + Olympic в одной session)         | Couplet/triplet/chipper — основа CF                     |
| Movement            | Каждое имеет набор modifications + scaling rules (включая prosthetics / PTSD-aware для военных)    | Adaptive — first-class, military rehab — specific track |
| Periodization       | week → block (mesocycle) → cycle (macrocycle)                                                      | Wingate-академик мыслит блоками                         |
| Прогрессия          | Single-axis per block (load OR volume)                                                             | См. [[one-progression-axis]]                            |
| Readiness           | Sliding scale, не bool, runtime override                                                           | См. [[skip-lights-start]]                               |
| Archetypes          | First-class entities, не string templates                                                          | §5.4 — direct response to "EMOM × 200" pain             |
| Authoring           | Constructive editor (assemble), не prose editor (write)                                            | §5.4                                                    |
| Delivery mode       | Async-first (notes, video cues, athlete log)                                                       | 11K-following бренд + >100 атлетов соло                 |
| Discipline coverage | Domain shape generic enough для ТА / ББ / ФББ / CF / лёгкая атлетика / реабилитация / Olympic prep | Reality of his portfolio                                |
| Resilience          | Equipment substitutions, missed-session = "поезд уехал"                                            | War-era constraints + train metaphor                    |

## 8. Gaps (что мы НЕ знаем — спросить у реального Дениса)

- Точное название и адрес зала во Львове («Бруклин» — verify)
- Точный год выпуска Wingate (полная степень, multi-летняя учёба — какие годы?)
- Точное число активных атлетов (>100, но 120 или 300?)
- Распределение атлетов по дисциплинам (% ТА vs CF vs реабилитация vs Olympic prep)
- Распределение online vs offline в часах в неделю
- Распределение клиентов по языкам (RU/UA/EN)
- Точный mobile app которым клиенты пользуются сейчас (название, owner, какие фичи)
- Какой % атлетов сейчас в военной реабилитации
- Что в community уже есть и куда он хочет вырасти
- Vision beyond community (курсы для других тренеров? франчайз методологии? просто scale текущего coaching?)
- Когда именно был релокейт Кременчуг → Wingate → Lviv (precise years)

## 9. Open UX questions (для следующего разговора с Денисом)

> Append-only. Каждая запись — формулировка для **реального** разговора, не догадка.

- **Train metaphor edges:** что происходит если athlete купил подписку, но **первый день уже прошёл**? Включается со следующего? Или со-следующего? Pro-rate?
- **Pause vs unsubscribe:** есть ли промежуточное состояние "временно сошёл с поезда" (отпуск / болезнь) с правом вернуться в тот же план? Или это unsubscribe → resubscribe = новый поезд?
- **Military rehab specifics:** какие конкретно accommodations нужны? Prosthetics tracking? PTSD-aware intensity caps? Какие категории движений запрещены?
- **Olympic prep workflow:** как он сейчас программирует олимпийцев — это тот же plan-as-train или индивидуальный custom track?
- **Excel pain anatomy:** что **именно** в Excel заёбывает больше всего — копирование, поиск, отсутствие linking, отсутствие версий? (показать 2-3 его реальные таблицы)
- **Mobile app для атлетов:** атлет открывает приложение в зале — что он сейчас видит, и что хотел бы видеть Денис чтобы он там видел?
- **Community shape:** что сейчас работает (Instagram? Telegram-чат? отдельная платформа?), куда вырасти

## 10. Decisions log

> Append-only журнал **реальных** UX/product решений Дениса. Каждая запись = реальная цитата / сообщение / решение, с датой и контекстом. **Не догадки агента**.

### 2026-05-19 — План как поезд (via Максим)

**Context:** Максим расшифровал product mental model в ответ на 16 вопросов для построения профайла Дениса.

**Decision:** Plan = train с собственным timetable; athletes = passengers садятся/сходят; пропустил день = "поезд уехал", не make up; персональная программа = новый поезд (новый Plan instance).

**Verbatim (Максим, передаёт Денисову модель):**

> "На поезд может сесть один пассажир, а может набиться битком, поезд просто продолжает ехать. Нужна персональная программа — на рельсы выходит новый поезд."
> "Денис злится когда говорят 'я пропустил один день, хочу потренироваться за пропущенный' — поэтому появилась модель подписок и плана-поезда: денег нет → пассажир сходит."

**Rationale:** Train metaphor выросла из конкретных pain points (споры за пропущенные дни, негодование на запросы make-up). Subscription model рождена тем же — payment-based passenger status.

### 2026-05-19 — «Конструкция, не сочинение» (via Максим)

**Context:** тот же диалог.

**Decision:** Authoring UX = constructive editor (собрать из блоков), не prose editor (написать текст). Это **прямая** мотивация для archetype entities в domain model.

**Verbatim (Максим про Денисову frustration):**

> "Заёбывает копировать таблицы и писать одно и то же каждый раз, отслеживать периодичность по памяти, писать ЕМОМ по 200 раз в неделю (отсюда архетипы в доменной модели), писать тренировочный план как сочинение, а не собирать как конструкцию."

**Rationale:** текущий Excel-tooling вынуждает narrative; archetype-based constructor = его mental model.

## 11. Sources

- [@the_discipline_program (Instagram)](https://www.instagram.com/the_discipline_program/)
- [@denis\_\_sergeev (Instagram post)](https://www.instagram.com/p/BWxd--YAp6B/)
- [Denis Linetskiy on up4sport (Tonus, Kremenchuk)](https://up4sport.com/user/denis-linetskiy)
- [Tonus Kremenchug (Instagram)](https://www.instagram.com/tonus_kremenchug/)
- [Dog Autumn Showdown 2019, Линецкий Денис, Elite (YouTube)](https://www.youtube.com/watch?v=3bQH2QdYoE8)
- [KyivBattle 2018, Линецкий Денис, Аматоры (YouTube)](https://www.youtube.com/watch?v=7fffiUVSRag)
- [Wingate Institute (Israel) — official](https://wingate.org.il/en/about/)
- [Wingate Institute (Wikipedia)](https://en.wikipedia.org/wiki/Wingate_Institute)
- Личный диалог Maksim ↔ Claude, 2026-05-19 (16-вопросный профайл-fill)
