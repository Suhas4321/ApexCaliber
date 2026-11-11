import React, { useEffect, useRef } from 'react'

interface BandsShaderProps {
  className?: string
  speed?: number // Framer default: 0.3
  scale?: number // Framer default: 3.7
  spacing?: number // Framer default: 1.0
  radius?: number // Framer default: 0.41
}

const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_speed;
  uniform float u_scale;
  uniform float u_spacing;
  uniform float u_radius;

  // Achilles 3-Tone Palette
  const vec3 BG_COLOR    = vec3(0.031, 0.031, 0.031); // #080808
  const vec3 DARK_PINE   = vec3(0.039, 0.125, 0.086); // #0A2016
  const vec3 MID_EMERALD = vec3(0.000, 0.700, 0.380); // #00B361
  const vec3 MINT_ACCENT = vec3(0.000, 1.000, 0.533); // #00FF88

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    // Time scaling matching Framer speed: 0.3
    float t = u_time * u_speed;

    // Organic wavy movement along the fluted columns
    float wave = sin(uv.y * 2.8 + t * 0.9) * 0.07 +
                 cos(uv.y * 5.2 - t * 0.6) * 0.03 +
                 sin(uv.x * 3.4 + t * 0.4) * 0.02;

    // Scale (3.7) & Horizontal Spacing (1.0)
    float bandCoord = (uv.x + wave) * u_scale * u_spacing * max(aspect, 1.0);
    float f = fract(bandCoord);
    float dist = abs(f - 0.5) * 2.0;

    // Cylinder profile matching radius: 0.41
    float bandMask = smoothstep(1.0 - u_radius, u_radius * 0.35, dist);
    float cylinder = sqrt(max(0.0, 1.0 - pow(dist, 2.0)));
    float lighting = bandMask * cylinder;

    // Vertical top-bias fade (bright at top, tapering into base)
    float vFade = smoothstep(0.05, 0.85, uv.y + sin(uv.x * 3.0 + t) * 0.08);

    // Color gradient composition across the 3 tones
    vec3 col = BG_COLOR;
    col = mix(col, DARK_PINE, bandMask * 0.85 * vFade);
    col = mix(col, MID_EMERALD, lighting * 0.60 * vFade);
    col = mix(col, MINT_ACCENT, pow(lighting, 2.6) * 0.75 * vFade);

    gl_FragColor = vec4(col, 1.0);
  }
`

export const BandsShaderBackground: React.FC<BandsShaderProps> = ({
  className = '',
  speed = 0.3,
  scale = 3.7,
  spacing = 1.0,
  radius = 0.41,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vertShader || !fragShader) {
      if (vertShader) gl.deleteShader(vertShader)
      if (fragShader) gl.deleteShader(fragShader)
      return
    }

    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vertShader)
      gl.deleteShader(fragShader)
      return
    }
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      gl.deleteShader(vertShader)
      gl.deleteShader(fragShader)
      return
    }
    gl.useProgram(program)

    // Full-screen quad buffer
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const posAttr = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    // Uniform locations
    const timeLoc = gl.getUniformLocation(program, 'u_time')
    const resLoc = gl.getUniformLocation(program, 'u_resolution')
    const speedLoc = gl.getUniformLocation(program, 'u_speed')
    const scaleLoc = gl.getUniformLocation(program, 'u_scale')
    const spacingLoc = gl.getUniformLocation(program, 'u_spacing')
    const radiusLoc = gl.getUniformLocation(program, 'u_radius')

    gl.uniform1f(speedLoc, speed)
    gl.uniform1f(scaleLoc, scale)
    gl.uniform1f(spacingLoc, spacing)
    gl.uniform1f(radiusLoc, radius)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }
    resize()

    let animationFrameId: number | null = null
    let isVisible = true
    let isTabVisible = !document.hidden
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let prefersReducedMotion = mediaQuery.matches
    const startTime = performance.now()

    const drawFrame = (now: number) => {
      resize()
      const elapsed = (now - startTime) / 1000
      gl.uniform1f(timeLoc, prefersReducedMotion ? 0.0 : elapsed)
      gl.uniform2f(resLoc, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const stopLoop = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    }

    const render = (now: number) => {
      if (!isVisible || !isTabVisible || prefersReducedMotion) {
        animationFrameId = null
        return
      }
      drawFrame(now)
      animationFrameId = requestAnimationFrame(render)
    }

    const syncPlayback = () => {
      if (prefersReducedMotion || !isVisible || !isTabVisible) {
        stopLoop()
        if (prefersReducedMotion) drawFrame(performance.now())
        return
      }
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    drawFrame(performance.now())

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (prefersReducedMotion) drawFrame(performance.now())
    })
    resizeObserver.observe(canvas)
    window.addEventListener('resize', resize)

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = Boolean(entry?.isIntersecting)
      syncPlayback()
    })
    intersectionObserver.observe(canvas)

    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches
      syncPlayback()
    }
    mediaQuery.addEventListener('change', onMotionChange)

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden
      syncPlayback()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    syncPlayback()

    return () => {
      stopLoop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      mediaQuery.removeEventListener('change', onMotionChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', resize)
      if (buffer) gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertShader)
      gl.deleteShader(fragShader)
    }
  }, [speed, scale, spacing, radius])

  const positionClasses = className.trim() || 'top-0 h-[75%]'

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 z-0 w-full overflow-hidden ${positionClasses}`}
      style={{
        maskImage: 'linear-gradient(17deg, rgba(0, 0, 0, 0) 44%, #000 100%)',
        WebkitMaskImage: 'linear-gradient(17deg, rgba(0, 0, 0, 0) 44%, #000 100%)',
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}

export default BandsShaderBackground
