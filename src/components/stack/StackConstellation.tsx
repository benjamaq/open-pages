'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

export type StackConstellationItem = {
	id: string
	name: string
	shortName: string
	category: string
	status: 'Testing' | 'Working' | 'Not working' | 'No clear effect' | 'Archived'
	monthly: number | null
	details?: {
		onAvg?: number | null
		offAvg?: number | null
		daysOn?: number | null
		daysOff?: number | null
		reqOn?: number | null
		reqOff?: number | null
		confidenceText?: string | null
		effectText?: string | null
	}
}

type Props = {
	items: StackConstellationItem[]
	width?: number
	height?: number
	showArchived?: boolean
	onSelect?: (id: string | null) => void
}

type Node = StackConstellationItem & { x: number; y: number; r: number; color: string; hidden?: boolean }

const STATUS_COLOR: Record<StackConstellationItem['status'], string> = {
	Testing: '#C65A2E',
	Working: '#22C55E',
	'Not working': '#EF4444',
	'No clear effect': '#6B7280',
	Archived: '#9CA3AF'
}

export default function StackConstellation({ items, width = 900, height = 520, showArchived = false, onSelect }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: width, h: height })
	const [hoverId, setHoverId] = useState<string | null>(null)
	const [selectedId, setSelectedId] = useState<string | null>(null)

	useEffect(() => {
		function handle() {
			const el = containerRef.current
			if (!el) return
			const rect = el.getBoundingClientRect()
			const w = Math.max(320, Math.floor(rect.width))
			const h = Math.max(420, Math.floor((rect.width * 0.55)))
			setCanvasSize({ w, h })
		}
		handle()
		window.addEventListener('resize', handle)
		return () => window.removeEventListener('resize', handle)
	}, [])

	const nodes = useMemo<Node[]>(() => {
		const filtered = items.filter(it => showArchived || it.status !== 'Archived')
		const minR = 16
		const maxR = 56
		const knownCosts = filtered.map(f => (typeof f.monthly === 'number' && f.monthly > 0 ? f.monthly : 0))
		const maxCost = Math.max(10, ...knownCosts)
		function radiusFor(cost?: number | null) {
			if (!cost || cost <= 0) return minR
			const s = Math.sqrt(cost / maxCost)
			return Math.max(minR, Math.min(maxR, minR + s * (maxR - minR)))
		}
		// Cluster centers per category
		const cats = Array.from(new Set(filtered.map(f => f.category)))
		const cols = Math.ceil(Math.sqrt(cats.length))
		const rows = Math.ceil(cats.length / cols)
		const pad = 70
		const gridW = Math.max(320, width - pad * 2)
		const gridH = Math.max(320, height - pad * 2)
		const cellW = gridW / Math.max(cols, 1)
		const cellH = gridH / Math.max(rows, 1)

		const catCenter = new Map<string, { cx: number; cy: number }>()
		cats.forEach((c, i) => {
			const gx = i % cols
			const gy = Math.floor(i / cols)
			const cx = pad + gx * cellW + cellW / 2
			const cy = pad + gy * cellH + cellH / 2
			catCenter.set(c, { cx, cy })
		})
		// Deterministic positioning around centers with simple collision relaxation
		const result: Node[] = filtered.map((f, i) => {
			const c = catCenter.get(f.category) || { cx: width / 2, cy: height / 2 }
			const r = radiusFor(f.monthly)
			// place in a local spiral
			const angle = (i * 137.508) * (Math.PI / 180) // golden angle
			const dist = (i % 7) * (r + 6)
			const x = c.cx + Math.cos(angle) * dist
			const y = c.cy + Math.sin(angle) * dist
			return { ...f, x, y, r, color: STATUS_COLOR[f.status] }
		})
		// Relax collisions
		for (let iter = 0; iter < 25; iter++) {
			for (let i = 0; i < result.length; i++) {
				for (let j = i + 1; j < result.length; j++) {
					const a = result[i], b = result[j]
					const dx = b.x - a.x
					const dy = b.y - a.y
					const d2 = dx * dx + dy * dy
					const minDist = a.r + b.r + 6
					if (d2 > 0) {
						const d = Math.sqrt(d2)
						if (d < minDist) {
							const overlap = (minDist - d) / 2
							const ux = dx / d
							const uy = dy / d
							a.x -= ux * overlap
							a.y -= uy * overlap
							b.x += ux * overlap
							b.y += uy * overlap
						}
					}
				}
			}
			// pull toward center
			for (const n of result) {
				const c = catCenter.get(n.category) || { cx: width / 2, cy: height / 2 }
				n.x += (c.cx - n.x) * 0.02
				n.y += (c.cy - n.y) * 0.02
			}
		}
		return result
	}, [items, width, height, showArchived])

	const catLabels = useMemo(() => {
		const map = new Map<string, { x: number; y: number }>()
		nodes.forEach(n => {
			if (!map.has(n.category)) {
				map.set(n.category, { x: n.x, y: n.y })
			} else {
				const v = map.get(n.category)!
				v.x = (v.x + n.x) / 2
				v.y = (v.y + n.y) / 2
			}
		})
		return Array.from(map.entries()).map(([category, pos]) => ({ category, ...pos }))
	}, [nodes])

	return (
		<div ref={containerRef} className="w-full">
			<div className="flex items-center justify-between mb-2">
				<div className="text-xs text-[#6B7280]">Constellation</div>
			</div>
			<svg width={canvasSize.w} height={canvasSize.h} className="w-full h-auto select-none">
				{/* cluster labels */}
				{catLabels.map(cl => (
					<text key={cl.category} x={cl.x} y={cl.y - 50} textAnchor="middle" className="fill-[#6B7280]" style={{ fontSize: 11, fontWeight: 600 }}>
						{cl.category}
					</text>
				))}
				{/* links (optional) */}
				{/* nodes */}
				{nodes.map(n => {
					const label = n.shortName || n.name
					const cost = (typeof n.monthly === 'number' && n.monthly > 0) ? `$${n.monthly}/mo` : '—'
					const isHover = hoverId === n.id
					return (
						<g key={n.id} transform={`translate(${n.x}, ${n.y})`} style={{ cursor: 'pointer' }}
							onMouseEnter={() => setHoverId(n.id)}
							onMouseLeave={() => setHoverId(null)}
							onClick={() => { setSelectedId(n.id); onSelect?.(n.id) }}>
							<circle r={n.r} fill={n.color} opacity={0.18} />
							<circle r={n.r - 2} fill="#FFFFFF" stroke={n.color} strokeWidth={2} />
							{textLines(label, 12, 2).map((line, i, arr) => (
								<text key={i} y={-((arr.length - 1) * 12) / 2 + i * 12} textAnchor="middle" className="fill-[#111111]" style={{ fontSize: 12, fontWeight: 600 }}>
									{line}
								</text>
							))}
							<text y={n.r / 2} textAnchor="middle" className="fill-[#6B7280]" style={{ fontSize: 11 }}>{cost}</text>
							{isHover && (
								<circle r={n.r + 6} fill="none" stroke={n.color} strokeWidth={1.5} opacity={0.5} />
							)}
						</g>
					)
				})}
			</svg>
		</div>
	)
}

function textLines(text: string, charsPerLine: number, maxLines: number): string[] {
	const words = text.split(/\s+/)
	const lines: string[] = []
	let cur = ''
	for (const w of words) {
		if ((cur + ' ' + w).trim().length > charsPerLine) {
			lines.push(cur.trim())
			cur = w
		} else {
			cur += ' ' + w
		}
		if (lines.length >= maxLines) break
	}
	if (lines.length < maxLines && cur.trim()) lines.push(cur.trim())
	return lines.slice(0, maxLines)
}
