/**
 * Checks device capabilities before starting inference.
 * Returns { capable: boolean, delegate: 'GPU'|'CPU', reason?: string, warnings: string[] }
 */
export function checkCapabilities() {
  const warnings = [];
  let delegate = 'GPU';

  // Check camera API availability
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      capable: false,
      delegate,
      reason: 'Camera access is not available in this browser. Use Chrome, Safari, or Firefox on a device with a camera.',
      warnings,
    };
  }

  // Check WebGL2 (required for GPU delegate)
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    const gl1 = canvas.getContext('webgl');
    if (!gl1) {
      return {
        capable: false,
        delegate: 'CPU',
        reason: 'Your browser does not support WebGL. This app requires a modern browser with GPU acceleration.',
        warnings,
      };
    }
    delegate = 'CPU';
    warnings.push('WebGL2 not available. Using CPU inference (slower).');
  } else {
    // Check for software renderers
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (renderer.includes('SwiftShader') || renderer.includes('llvmpipe')) {
        delegate = 'CPU';
        warnings.push('Software GPU renderer detected. Using CPU inference.');
      }
    }

    // Check max texture size (low values indicate weak GPU)
    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (maxTexture < 4096) {
      warnings.push('Limited GPU detected. Performance may be reduced.');
    }

    // Clean up WebGL context
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }

  // Check available memory (Chrome only)
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    warnings.push('Low device memory detected. Consider closing other tabs.');
  }

  return { capable: true, delegate, warnings };
}
