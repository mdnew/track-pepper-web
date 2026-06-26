#!/usr/bin/env node
/**
 * Generates schedule plan SQL from the dog/cat HTML reference files.
 * Usage: node scripts/generate-schedule-seeds.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const DOG_HTML = '/Users/mnew/Downloads/dog-schedules-all-ages.html'
const CAT_HTML = '/Users/mnew/Downloads/cat-schedules-all-ages.html'

const dogPlans = [
  {
    id: 'dog_newborn',
    species: 'dog',
    name: 'Newborn (0–8 weeks)',
    emoji: '🐣',
    minAgeDays: 0,
    maxAgeDays: 56,
  },
  {
    id: 'dog_young_puppy',
    species: 'dog',
    name: 'Young Puppy (8–12 weeks)',
    emoji: '🍼',
    minAgeDays: 56,
    maxAgeDays: 84,
  },
  {
    id: 'dog_3_4_months',
    species: 'dog',
    name: '3–4 Months',
    emoji: '🌱',
    minAgeDays: 84,
    maxAgeDays: 120,
  },
  {
    id: 'dog_4_6_months',
    species: 'dog',
    name: '4–6 Months',
    emoji: '🐕',
    minAgeDays: 120,
    maxAgeDays: 180,
  },
  {
    id: 'dog_6_12_months',
    species: 'dog',
    name: '6–12 Months',
    emoji: '🦮',
    minAgeDays: 180,
    maxAgeDays: 365,
  },
  {
    id: 'dog_adult',
    species: 'dog',
    name: 'Adult (1–7 years)',
    emoji: '🐶',
    minAgeDays: 365,
    maxAgeDays: 2555,
  },
  {
    id: 'dog_senior',
    species: 'dog',
    name: 'Senior (7+ years)',
    emoji: '🦳',
    minAgeDays: 2555,
    maxAgeDays: null,
  },
]

const catPlans = [
  {
    id: 'cat_newborn',
    species: 'cat',
    name: 'Newborn (0–4 weeks)',
    emoji: '🐣',
    minAgeDays: 0,
    maxAgeDays: 28,
  },
  {
    id: 'cat_kitten',
    species: 'cat',
    name: 'Young Kitten (4–12 weeks)',
    emoji: '🍼',
    minAgeDays: 28,
    maxAgeDays: 84,
  },
  {
    id: 'cat_junior',
    species: 'cat',
    name: 'Junior (3–6 months)',
    emoji: '🌱',
    minAgeDays: 84,
    maxAgeDays: 180,
  },
  {
    id: 'cat_adolescent',
    species: 'cat',
    name: 'Adolescent (6–18 months)',
    emoji: '🐈',
    minAgeDays: 180,
    maxAgeDays: 365,
  },
  {
    id: 'cat_adult',
    species: 'cat',
    name: 'Adult (1–7 years)',
    emoji: '🐱',
    minAgeDays: 365,
    maxAgeDays: 2555,
  },
  {
    id: 'cat_mature',
    species: 'cat',
    name: 'Mature (7–11 years)',
    emoji: '🦳',
    minAgeDays: 2555,
    maxAgeDays: 4015,
  },
  {
    id: 'cat_senior',
    species: 'cat',
    name: 'Senior (11+ years)',
    emoji: '🌙',
    minAgeDays: 4015,
    maxAgeDays: null,
  },
]

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
}

function sqlString(value) {
  if (value == null) return 'NULL'
  return `'${String(value).replace(/'/g, "''")}'`
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim()
}

function parsePanels(html) {
  const starts = [...html.matchAll(/<div class="panel[^"]*" id="panel-\d+">/g)]
  const legendIndex = html.indexOf('<!-- Legend -->')
  const end = legendIndex >= 0 ? legendIndex : html.indexOf('<script>')

  return starts.map((match, index) => {
    const start = match.index + match[0].length
    const stop =
      index + 1 < starts.length ? starts[index + 1].index : end
    return html.slice(start, stop)
  })
}

function parsePanelContent(panelHtml) {
  const introMatch = panelHtml.match(
    /<div class="stage-intro">[\s\S]*?<h2>([\s\S]*?)<\/h2>[\s\S]*?<p>([\s\S]*?)<\/p>/,
  )
  const tipsMatch = panelHtml.match(
    /<div class="tips">[\s\S]*?<strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/div>/,
  )

  const introTitle = introMatch ? stripTags(introMatch[1]) : null
  const introDescription = introMatch ? stripTags(introMatch[2]) : null
  const tipsTitle = tipsMatch ? stripTags(tipsMatch[1]) : null
  const tipsBody = tipsMatch ? stripTags(tipsMatch[2]) : null

  const items = []
  let currentSection = 'General'

  const dividerRegex = /<div class="divider">([\s\S]*?)<\/div>/g
  const blockStarts = [...panelHtml.matchAll(/<div class="block (\w+)">/g)]
  const tipsIndex = panelHtml.indexOf('<div class="tips"')

  let dividerMatch
  const dividers = []
  while ((dividerMatch = dividerRegex.exec(panelHtml)) !== null) {
    dividers.push({
      index: dividerMatch.index,
      section: stripTags(dividerMatch[1]).replace(/^—\s*|\s*—$/g, ''),
    })
  }

  function sectionForBlockIndex(index) {
    let section = 'General'
    for (const divider of dividers) {
      if (divider.index < index) section = divider.section
      else break
    }
    return section
  }

  blockStarts.forEach((match, blockIndex) => {
    const category = match[1]
    const start = match.index + match[0].length
    const end =
      blockIndex + 1 < blockStarts.length
        ? blockStarts[blockIndex + 1].index
        : tipsIndex >= 0
          ? tipsIndex
          : panelHtml.length
    const blockHtml = panelHtml.slice(start, end)

    const timeMatch = blockHtml.match(/<div class="time">([\s\S]*?)<\/div>/)
    const iconMatch = blockHtml.match(/<div class="icon">([\s\S]*?)<\/div>/)
    const titleMatch = blockHtml.match(/<strong>([\s\S]*?)<\/strong>/)
    const subtitleMatch = blockHtml.match(/<span>([\s\S]*?)<\/span>/)

    items.push({
      section: sectionForBlockIndex(match.index),
      category,
      timeLabel: timeMatch ? stripTags(timeMatch[1]) : '',
      icon: iconMatch ? stripTags(iconMatch[1]) : '•',
      title: titleMatch ? stripTags(titleMatch[1]) : 'Task',
      subtitle: subtitleMatch ? stripTags(subtitleMatch[1]) : null,
    })
  })

  return { introTitle, introDescription, tipsTitle, tipsBody, items }
}

function buildTasks(planId, panel) {
  return panel.items.map((item, index) => {
    const id = `${planId}_${slugify(item.title)}_${index + 1}`
    return {
      id,
      planId,
      sortOrder: index + 1,
      ...item,
    }
  })
}

function generateSpeciesPlans(html, plans) {
  const panels = parsePanels(html)
  if (panels.length !== plans.length) {
    throw new Error(`Expected ${plans.length} panels, found ${panels.length}`)
  }

  const parsedPlans = []
  const tasks = []

  plans.forEach((plan, index) => {
    const panel = parsePanelContent(panels[index])
    parsedPlans.push({ ...plan, ...panel })
    tasks.push(...buildTasks(plan.id, panel))
  })

  return { plans: parsedPlans, tasks }
}

function renderSql(dog, cat) {
  const lines = ['-- Generated schedule plans and tasks from HTML reference files', '']

  lines.push('INSERT INTO schedule_plans (id, species, name, emoji, intro_title, intro_description, tips_title, tips_body, min_age_days, max_age_days) VALUES')
  const allPlans = [...dog.plans, ...cat.plans]
  lines.push(
    allPlans
      .map(
        (plan) =>
          `  (${sqlString(plan.id)}, ${sqlString(plan.species)}, ${sqlString(plan.name)}, ${sqlString(plan.emoji)}, ${sqlString(plan.introTitle)}, ${sqlString(plan.introDescription)}, ${sqlString(plan.tipsTitle)}, ${sqlString(plan.tipsBody)}, ${plan.minAgeDays}, ${plan.maxAgeDays ?? 'NULL'})`,
      )
      .join(',\n') + ';',
  )

  lines.push('')
  lines.push('INSERT INTO schedule_tasks (id, plan_id, sort_order, time_label, category, title, subtitle, icon, section) VALUES')

  const allTasks = [...dog.tasks, ...cat.tasks]
  lines.push(
    allTasks
      .map(
        (task) =>
          `  (${sqlString(task.id)}, ${sqlString(task.planId)}, ${task.sortOrder}, ${sqlString(task.timeLabel)}, ${sqlString(task.category)}, ${sqlString(task.title)}, ${sqlString(task.subtitle)}, ${sqlString(task.icon)}, ${sqlString(task.section)})`,
      )
      .join(',\n') + ';',
  )

  return lines.join('\n') + `

ALTER TABLE schedule_tasks ALTER COLUMN plan_id SET NOT NULL;
ALTER TABLE completions ALTER COLUMN pet_id SET NOT NULL;
`
}

const dog = generateSpeciesPlans(fs.readFileSync(DOG_HTML, 'utf8'), dogPlans)
const cat = generateSpeciesPlans(fs.readFileSync(CAT_HTML, 'utf8'), catPlans)

const sql = renderSql(dog, cat)
const outPaths = [
  path.join(root, 'supabase/migrations/008_seed_schedule_plans.sql'),
  path.join(root, '../supabase/migrations/008_seed_schedule_plans.sql'),
  path.join(root, '../mobile/supabase/migrations/008_seed_schedule_plans.sql'),
]

for (const outPath of outPaths) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, sql)
  console.log(`Wrote ${outPath} (${dog.tasks.length + cat.tasks.length} tasks)`)
}
