#!/usr/bin/env python3
"""
Dynamical Systems Treatise — Publication Figures
=================================================
Figures for "Describing the Structure of Dynamical Systems" (Parts I–IX).
Built on the PSEII figure style conventions for visual consistency.

Figures:
  F1: Cross-domain R/I/C schematic (Part III)
  F2: Heat equation spectral example (Part VIII)
  F3: State-space block diagram (Part VI)
  F4: Underdetermination illustration (Part IX)
  F5: Two-step construction flowchart (Part VII)

Usage:
  python dsl_figures.py           # Generate all figures
  python dsl_figures.py F1        # Generate a single figure
  python dsl_figures.py F1 F2     # Generate specific figures
"""

import sys
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Rectangle
from matplotlib.lines import Line2D
from pathlib import Path

# =============================================================================
# STYLE — inherited from PSEII StyleConfig, adapted for journal figures
# =============================================================================

COLORS = {
    'resistance':   '#E63946',   # Red — dissipation
    'inertance':    '#457B9D',   # Blue — kinetic storage
    'compliance':   '#2A9D8F',   # Teal — potential storage
    'text':         '#1A1A1A',   # Near-black
    'axis':         '#333333',
    'grid':         '#E5E5E5',
    'background':   '#FFFFFF',
    'light_gray':   '#F0F0F0',
    'mid_gray':     '#999999',
    'domain_elec':  '#1D3557',   # Dark blue — electrical
    'domain_mech':  '#E76F51',   # Orange — mechanical
    'domain_hydr':  '#6A994E',   # Green — hydraulic
    'intrinsic':    '#457B9D',   # Blue — intrinsic/response
    'extrinsic':    '#E76F51',   # Orange — extrinsic/drive
    'highlight':    '#FFE066',
    # Spectral figure colors
    'profile_a':    '#E63946',   # Red — triangular peak
    'profile_b':    '#1D3557',   # Dark blue — step function
    'mode_1':       '#2A9D8F',   # Teal — fundamental mode
    'mode_2':       '#E76F51',   # Orange — second mode
    'mode_3':       '#9B59B6',   # Purple — third mode
    'steady':       '#333333',   # Dark — long-time behavior
}

FONT = {
    'tiny': 8, 'small': 9, 'normal': 11, 'large': 13, 'title': 15, 'label': 10,
}

def setup_style():
    """Configure matplotlib for publication-quality output."""
    plt.rcParams.update({
        'font.family': 'serif',
        'font.serif': ['CMU Serif', 'Computer Modern', 'DejaVu Serif', 'Times New Roman'],
        'mathtext.fontset': 'cm',
        'font.size': FONT['normal'],
        'axes.labelsize': FONT['large'],
        'axes.titlesize': FONT['large'],
        'xtick.labelsize': FONT['small'],
        'ytick.labelsize': FONT['small'],
        'legend.fontsize': FONT['small'],
        'figure.facecolor': COLORS['background'],
        'axes.facecolor': COLORS['background'],
        'axes.edgecolor': COLORS['axis'],
        'axes.linewidth': 0.8,
        'lines.linewidth': 1.5,
        'savefig.dpi': 300,
        'savefig.bbox': 'tight',
        'savefig.pad_inches': 0.1,
    })

# =============================================================================
# F1: Cross-Domain R/I/C Schematic
# =============================================================================

def figure_F1(save_path=None):
    """
    Cross-domain R/I/C schematic showing the three energy roles
    (dissipation, kinetic storage, potential storage) mapped across
    electrical, mechanical, and hydraulic domains.
    """
    setup_style()
    fig, ax = plt.subplots(figsize=(9, 5.5))
    ax.set_xlim(-0.5, 9.5)
    ax.set_ylim(-0.5, 6.5)
    ax.set_aspect('equal')
    ax.axis('off')

    # --- Layout: 3 columns (R, I, C) × 3 rows (elec, mech, hydr) + header ---
    col_x = [1.5, 4.5, 7.5]     # column centers
    row_y = [4.5, 2.8, 1.1]     # row centers
    box_w, box_h = 2.4, 1.2

    # Column headers (energy roles)
    role_labels = [
        ('Dissipation\n(R)', COLORS['resistance']),
        ('Kinetic Storage\n(I)', COLORS['inertance']),
        ('Potential Storage\n(C)', COLORS['compliance']),
    ]
    for i, (label, color) in enumerate(role_labels):
        ax.text(col_x[i], 6.0, label, ha='center', va='center',
                fontsize=FONT['large'], fontweight='bold', color=color)

    # Row headers (domains)
    domain_labels = [
        ('Electrical', COLORS['domain_elec']),
        ('Mechanical', COLORS['domain_mech']),
        ('Hydraulic',  COLORS['domain_hydr']),
    ]
    for j, (label, color) in enumerate(domain_labels):
        ax.text(-0.3, row_y[j], label, ha='right', va='center',
                fontsize=FONT['normal'], fontweight='bold', color=color,
                rotation=0)

    # Cell contents: [row][col] = (element_name, symbol, equation)
    cells = [
        # Electrical
        [('Resistor',   'R', r'$V = RI$'),
         ('Inductor',   'L', r'$V = L\frac{dI}{dt}$'),
         ('Capacitor',  'C', r'$I = C\frac{dV}{dt}$')],
        # Mechanical
        [('Damper',     'b', r'$F = bv$'),
         ('Mass',       'm', r'$F = m\frac{dv}{dt}$'),
         ('Spring',     'k', r'$F = kx$')],
        # Hydraulic
        [('Restriction', r'$R_h$', r'$\Delta P = R_h Q$'),
         ('Inertance',   'I',      r'$\Delta P = I\frac{dQ}{dt}$'),
         ('Compliance',  r'$C_h$', r'$Q = C_h\frac{dP}{dt}$')],
    ]

    role_colors = [COLORS['resistance'], COLORS['inertance'], COLORS['compliance']]

    for j, row in enumerate(cells):
        for i, (name, symbol, eq) in enumerate(row):
            x, y = col_x[i], row_y[j]
            # Draw rounded box
            rect = FancyBboxPatch(
                (x - box_w/2, y - box_h/2), box_w, box_h,
                boxstyle="round,pad=0.1",
                facecolor=COLORS['light_gray'],
                edgecolor=role_colors[i],
                linewidth=1.5,
            )
            ax.add_patch(rect)
            # Element name + symbol
            ax.text(x, y + 0.22, f'{name} ({symbol})',
                    ha='center', va='center',
                    fontsize=FONT['small'], fontweight='bold',
                    color=COLORS['text'])
            # Constitutive equation
            ax.text(x, y - 0.22, eq,
                    ha='center', va='center',
                    fontsize=FONT['small'], color=COLORS['text'])

    # Energy flow arrows along bottom
    arrow_y = -0.1
    # Kinetic ↔ Potential
    ax.annotate('', xy=(col_x[2] - box_w/2 + 0.1, arrow_y),
                xytext=(col_x[1] + box_w/2 - 0.1, arrow_y),
                arrowprops=dict(arrowstyle='<->', color=COLORS['mid_gray'],
                                lw=1.5, connectionstyle='arc3,rad=0'))
    ax.text((col_x[1] + col_x[2]) / 2, arrow_y - 0.3,
            'energy exchange', ha='center', va='top',
            fontsize=FONT['tiny'], color=COLORS['mid_gray'], fontstyle='italic')

    # Dissipation arrow (out)
    ax.annotate('', xy=(col_x[0], arrow_y - 0.35),
                xytext=(col_x[0], arrow_y + 0.05),
                arrowprops=dict(arrowstyle='->', color=COLORS['resistance'],
                                lw=1.5))
    ax.text(col_x[0], arrow_y - 0.55, 'energy lost',
            ha='center', va='top',
            fontsize=FONT['tiny'], color=COLORS['resistance'], fontstyle='italic')

    if save_path:
        fig.savefig(save_path, dpi=300, bbox_inches='tight', facecolor='white')
        print(f'  Saved: {save_path}')
    return fig


# =============================================================================
# F2: Heat Equation Spectral Example
# =============================================================================

def figure_F2(save_path=None):
    """
    Heat equation spectral decomposition: two different initial profiles
    decompose into the same eigenfunctions with different coefficients,
    converging to the same long-time behavior (fundamental mode decay).

    Panel (a): Two initial profiles
    Panel (b): Transient evolution snapshots
    Panel (c): Convergence to fundamental mode
    """
    setup_style()
    fig, axes = plt.subplots(1, 3, figsize=(12, 3.5))

    x = np.linspace(0, 1, 500)
    alpha = 1.0  # thermal diffusivity (normalized)
    n_modes = 50  # for accurate reconstruction

    # --- Eigenfunction basis ---
    def phi(n, x):
        return np.sin(n * np.pi * x)

    def eigenvalue(n):
        return -alpha * (n * np.pi) ** 2

    # --- Initial profile A: triangular peak at x=0.3 ---
    def profile_a(x):
        peak = 0.3
        u = np.where(x <= peak, x / peak, (1 - x) / (1 - peak))
        return u

    # --- Initial profile B: step function on [0.2, 0.7] ---
    def profile_b(x):
        return np.where((x >= 0.2) & (x <= 0.7), 1.0, 0.0)

    # Fourier sine coefficients: c_n = 2 * int_0^1 u(x) sin(n pi x) dx
    def coefficients(profile_vals, x_grid, n_max):
        coeffs = []
        for n in range(1, n_max + 1):
            integrand = 2 * profile_vals * np.sin(n * np.pi * x_grid)
            c = np.trapezoid(integrand, x_grid)
            coeffs.append(c)
        return np.array(coeffs)

    # Reconstruct u(x,t) from spectral expansion
    def reconstruct(x, t, coeffs):
        u = np.zeros_like(x)
        for n_idx, c in enumerate(coeffs):
            n = n_idx + 1
            u += c * np.exp(eigenvalue(n) * t) * phi(n, x)
        return u

    coeffs_a = coefficients(profile_a(x), x, n_modes)
    coeffs_b = coefficients(profile_b(x), x, n_modes)

    # === Panel (a): Initial profiles ===
    ax = axes[0]
    ax.plot(x, profile_a(x), color=COLORS['profile_a'], lw=2, label='Profile A (triangle)')
    ax.plot(x, profile_b(x), color=COLORS['profile_b'], lw=2, label='Profile B (step)')
    ax.set_xlabel(r'$x$')
    ax.set_ylabel(r'$u(x, 0)$')
    ax.set_title('(a) Initial profiles', fontsize=FONT['normal'], fontweight='bold')
    ax.legend(fontsize=FONT['tiny'], loc='upper right')
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.1, 1.2)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    # === Panel (b): Transient snapshots ===
    ax = axes[1]
    times = [0, 0.005, 0.02, 0.05, 0.15]
    alphas_vis = [1.0, 0.8, 0.6, 0.4, 0.25]

    for t, a_vis in zip(times, alphas_vis):
        ua = reconstruct(x, t, coeffs_a)
        ub = reconstruct(x, t, coeffs_b)
        ax.plot(x, ua, color=COLORS['profile_a'], lw=1.5, alpha=a_vis)
        ax.plot(x, ub, color=COLORS['profile_b'], lw=1.5, alpha=a_vis, linestyle='--')

    # Time labels
    ax.text(0.5, 1.08, r'$t = 0$', ha='center', fontsize=FONT['tiny'],
            color=COLORS['mid_gray'])
    ax.annotate('', xy=(0.75, 0.15), xytext=(0.75, 0.85),
                arrowprops=dict(arrowstyle='->', color=COLORS['mid_gray'], lw=1))
    ax.text(0.78, 0.5, 'time', fontsize=FONT['tiny'], color=COLORS['mid_gray'],
            rotation=-90, va='center')

    ax.set_xlabel(r'$x$')
    ax.set_ylabel(r'$u(x, t)$')
    ax.set_title('(b) Transient evolution', fontsize=FONT['normal'], fontweight='bold')
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.1, 1.2)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    # Custom legend
    legend_lines = [
        Line2D([0], [0], color=COLORS['profile_a'], lw=1.5, label='A'),
        Line2D([0], [0], color=COLORS['profile_b'], lw=1.5, ls='--', label='B'),
    ]
    ax.legend(handles=legend_lines, fontsize=FONT['tiny'], loc='upper right')

    # === Panel (c): Convergence to fundamental mode ===
    ax = axes[2]
    t_late = 0.15
    ua_late = reconstruct(x, t_late, coeffs_a)
    ub_late = reconstruct(x, t_late, coeffs_b)

    # Fundamental mode (n=1), scaled to match each profile's c_1
    fund_a = coeffs_a[0] * np.exp(eigenvalue(1) * t_late) * phi(1, x)
    fund_b = coeffs_b[0] * np.exp(eigenvalue(1) * t_late) * phi(1, x)

    ax.plot(x, ua_late, color=COLORS['profile_a'], lw=2, label='A at late time')
    ax.plot(x, ub_late, color=COLORS['profile_b'], lw=2, ls='--', label='B at late time')
    ax.plot(x, fund_a, color=COLORS['profile_a'], lw=1, ls=':', alpha=0.6)
    ax.plot(x, fund_b, color=COLORS['profile_b'], lw=1, ls=':', alpha=0.6)

    # Fundamental mode reference
    ax.plot(x, phi(1, x) * 0.15, color=COLORS['steady'], lw=1.5, ls='-.',
            alpha=0.5, label=r'$\sim \sin(\pi x)$')

    ax.set_xlabel(r'$x$')
    ax.set_ylabel(r'$u(x, t_{\mathrm{late}})$')
    ax.set_title('(c) Convergence to fundamental', fontsize=FONT['normal'], fontweight='bold')
    ax.legend(fontsize=FONT['tiny'], loc='upper right')
    ax.set_xlim(0, 1)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.tight_layout()

    if save_path:
        fig.savefig(save_path, dpi=300, bbox_inches='tight', facecolor='white')
        print(f'  Saved: {save_path}')
    return fig


# =============================================================================
# F3: State-Space Block Diagram
# =============================================================================

def figure_F3(save_path=None):
    """
    Block diagram showing dz/dt = A_theta * z + s(t), with the intrinsic
    matrix A_theta and extrinsic forcing s(t) as visually distinct inputs.
    """
    setup_style()
    fig, ax = plt.subplots(figsize=(8, 3))
    ax.set_xlim(-1, 11)
    ax.set_ylim(-1.5, 2.5)
    ax.set_aspect('equal')
    ax.axis('off')

    bw, bh = 2.0, 1.0  # box width, height

    # --- Blocks ---
    # Integrator (center)
    int_x, int_y = 5.0, 0.5
    int_box = FancyBboxPatch((int_x - bw/2, int_y - bh/2), bw, bh,
                              boxstyle="round,pad=0.08",
                              facecolor=COLORS['light_gray'],
                              edgecolor=COLORS['axis'], lw=1.5)
    ax.add_patch(int_box)
    ax.text(int_x, int_y, r'$\int$   (system)', ha='center', va='center',
            fontsize=FONT['normal'], color=COLORS['text'])

    # Summation node
    sum_x, sum_y = 2.5, 0.5
    circle = plt.Circle((sum_x, sum_y), 0.35, facecolor='white',
                         edgecolor=COLORS['axis'], lw=1.5)
    ax.add_patch(circle)
    ax.text(sum_x, sum_y, r'$+$', ha='center', va='center',
            fontsize=FONT['large'], color=COLORS['text'])

    # A_theta feedback block
    fb_x, fb_y = 5.0, -0.8
    fb_box = FancyBboxPatch((fb_x - bw/2, fb_y - bh*0.6/2), bw, bh*0.6,
                             boxstyle="round,pad=0.08",
                             facecolor='#E8F0FE',
                             edgecolor=COLORS['intrinsic'], lw=1.5)
    ax.add_patch(fb_box)
    ax.text(fb_x, fb_y, r'$\mathbf{A}_\theta$', ha='center', va='center',
            fontsize=FONT['large'], color=COLORS['intrinsic'], fontweight='bold')
    ax.text(fb_x, fb_y - 0.55, 'intrinsic', ha='center', va='top',
            fontsize=FONT['tiny'], color=COLORS['intrinsic'], fontstyle='italic')

    # --- Arrows ---
    arrow_kw = dict(arrowstyle='->', mutation_scale=15, lw=1.5)

    # s(t) input → summation
    ax.annotate('', xy=(sum_x - 0.35, sum_y), xytext=(-0.2, sum_y),
                arrowprops=dict(**arrow_kw, color=COLORS['extrinsic']))
    # Label above the arrow with white background to avoid overlap
    ax.text(0.7, sum_y + 0.55, r'$\mathbf{s}(t)$',
            fontsize=FONT['large'], color=COLORS['extrinsic'], fontweight='bold',
            ha='center', va='bottom',
            bbox=dict(boxstyle='round,pad=0.15', facecolor='white',
                      edgecolor='none', alpha=0.9))
    ax.text(0.7, sum_y + 0.4, 'extrinsic (drive)', ha='center', va='top',
            fontsize=FONT['tiny'], color=COLORS['extrinsic'], fontstyle='italic')

    # Summation → integrator
    ax.annotate('', xy=(int_x - bw/2, int_y), xytext=(sum_x + 0.35, sum_y),
                arrowprops=dict(**arrow_kw, color=COLORS['axis']))
    ax.text((sum_x + int_x - bw/2) / 2, int_y + 0.25,
            r'$\dot{\mathbf{z}}$', ha='center',
            fontsize=FONT['normal'], color=COLORS['text'])

    # Integrator → output z(t)
    out_x = 8.5
    ax.annotate('', xy=(out_x, int_y), xytext=(int_x + bw/2, int_y),
                arrowprops=dict(**arrow_kw, color=COLORS['axis']))
    ax.text(out_x + 0.15, int_y, r'$\mathbf{z}(t)$', ha='left', va='center',
            fontsize=FONT['large'], color=COLORS['text'], fontweight='bold')

    # Feedback: z(t) down → A_theta → back to summation
    # Down from output line
    tap_x = 7.5
    ax.plot([tap_x, tap_x], [int_y, fb_y], color=COLORS['intrinsic'], lw=1.5)
    ax.annotate('', xy=(fb_x + bw/2, fb_y), xytext=(tap_x, fb_y),
                arrowprops=dict(**arrow_kw, color=COLORS['intrinsic']))
    # A_theta output back left
    ax.plot([fb_x - bw/2, sum_x], [fb_y, fb_y], color=COLORS['intrinsic'], lw=1.5)
    ax.annotate('', xy=(sum_x, sum_y - 0.35), xytext=(sum_x, fb_y),
                arrowprops=dict(**arrow_kw, color=COLORS['intrinsic']))

    # Equation label
    ax.text(5.0, 2.1,
            r'$\dot{\mathbf{z}} = \mathbf{A}_\theta \mathbf{z} + \mathbf{s}(t)$',
            ha='center', va='center', fontsize=FONT['title'],
            color=COLORS['text'],
            bbox=dict(boxstyle='round,pad=0.3', facecolor=COLORS['highlight'],
                      edgecolor='none', alpha=0.5))

    if save_path:
        fig.savefig(save_path, dpi=300, bbox_inches='tight', facecolor='white')
        print(f'  Saved: {save_path}')
    return fig


# =============================================================================
# F4: Underdetermination Illustration
# =============================================================================

def figure_F4(save_path=None):
    """
    2D diagram showing that the same observation B can be produced by
    different (R, D) pairs — a hyperbola of constant B = R × D.
    """
    setup_style()
    fig, ax = plt.subplots(figsize=(5, 5))

    # Hyperbola: R * D = B (constant)
    B = 4.0
    R = np.linspace(0.5, 8, 300)
    D = B / R

    ax.plot(R, D, color=COLORS['text'], lw=2.5, label=r'$B = R \times D = \mathrm{const.}$')

    # Mark specific (R, D) pairs on the curve
    pairs = [
        (1.0, 4.0, 'A'),
        (2.0, 2.0, 'B'),
        (4.0, 1.0, 'C'),
        (5.5, B/5.5, 'D'),
    ]
    pair_colors = [COLORS['profile_a'], COLORS['intrinsic'],
                   COLORS['compliance'], COLORS['domain_mech']]

    for (r, d, lbl), col in zip(pairs, pair_colors):
        ax.plot(r, d, 'o', color=col, markersize=10, zorder=5)
        ax.annotate(f'({lbl})', xy=(r, d), xytext=(12, 8),
                    textcoords='offset points', fontsize=FONT['small'],
                    color=col, fontweight='bold')
        # Dashed lines to axes
        ax.plot([r, r], [0, d], '--', color=col, alpha=0.3, lw=1)
        ax.plot([0, r], [d, d], '--', color=col, alpha=0.3, lw=1)

    ax.set_xlabel(r'Response $R$ (intrinsic)', fontsize=FONT['large'])
    ax.set_ylabel(r'Drive $D$ (extrinsic)', fontsize=FONT['large'])
    ax.set_xlim(0, 8.5)
    ax.set_ylim(0, 8.5)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    # Annotation
    ax.text(5.5, 5.5,
            'All points on this\ncurve produce the\nsame observation $B$',
            fontsize=FONT['small'], color=COLORS['mid_gray'],
            fontstyle='italic', ha='center',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white',
                      edgecolor=COLORS['grid'], alpha=0.9))
    ax.annotate('', xy=(4.8, 1.2), xytext=(5.0, 4.8),
                arrowprops=dict(arrowstyle='->', color=COLORS['mid_gray'],
                                lw=1, connectionstyle='arc3,rad=-0.3'))

    ax.set_title('Structural Underdetermination', fontsize=FONT['large'],
                 fontweight='bold', pad=12)

    if save_path:
        fig.savefig(save_path, dpi=300, bbox_inches='tight', facecolor='white')
        print(f'  Saved: {save_path}')
    return fig


# =============================================================================
# F5: Two-Step Construction Flowchart
# =============================================================================

def figure_F5(save_path=None):
    """
    Flowchart: conservation law + constitutive relation → evolution PDE,
    replicated across all five domains.
    """
    setup_style()
    fig, ax = plt.subplots(figsize=(10, 4.5))
    ax.set_xlim(-0.5, 10.5)
    ax.set_ylim(-0.3, 4.8)
    ax.axis('off')

    bw, bh = 2.6, 0.75

    # --- Left column: generic construction (vertically stacked) ---
    # Right column spans y=0.3..4.0, midpoint=2.15
    # Center the three left blocks (span ~2.6 units) around that midpoint
    left_x = 2.0
    left_mid = 2.15  # match right-column midpoint
    cy1 = left_mid + 1.3   # conservation law
    cy2 = left_mid          # constitutive relation
    ey  = left_mid - 1.3   # evolution equation

    # Conservation law box
    box1 = FancyBboxPatch((left_x - bw/2, cy1 - bh/2), bw, bh,
                           boxstyle="round,pad=0.1",
                           facecolor='#FFF3E0', edgecolor=COLORS['extrinsic'], lw=1.5)
    ax.add_patch(box1)
    ax.text(left_x, cy1, 'Conservation Law\n' + r'$\partial_t u + \nabla \cdot \mathbf{J} = S$',
            ha='center', va='center', fontsize=FONT['small'])

    # Plus sign between
    ax.text(left_x, (cy1 + cy2) / 2, '+', ha='center', va='center',
            fontsize=FONT['title'], fontweight='bold', color=COLORS['mid_gray'])

    # Constitutive relation box
    box2 = FancyBboxPatch((left_x - bw/2, cy2 - bh/2), bw, bh,
                           boxstyle="round,pad=0.1",
                           facecolor='#E8F0FE', edgecolor=COLORS['intrinsic'], lw=1.5)
    ax.add_patch(box2)
    ax.text(left_x, cy2, 'Constitutive Relation\n' + r'$\mathbf{J} = -\alpha \nabla u$',
            ha='center', va='center', fontsize=FONT['small'])

    # Arrow down to evolution equation
    ax.annotate('', xy=(left_x, ey + bh/2 + 0.05), xytext=(left_x, cy2 - bh/2 - 0.05),
                arrowprops=dict(arrowstyle='->', color=COLORS['axis'], lw=2))

    # Evolution equation box (result)
    ew = 3.2
    ebox = FancyBboxPatch((left_x - ew/2, ey - bh/2), ew, bh,
                           boxstyle="round,pad=0.1",
                           facecolor=COLORS['highlight'], edgecolor=COLORS['text'],
                           lw=2, alpha=0.7)
    ax.add_patch(ebox)
    ax.text(left_x, ey, 'Evolution Equation\n' + r'$\partial_t u = \alpha \nabla^2 u + S$',
            ha='center', va='center', fontsize=FONT['small'], fontweight='bold')

    # --- Right column: domain instances ---
    domains = [
        ('Heat',        r'$\partial_t T = \alpha \nabla^2 T + S$',      COLORS['profile_a']),
        ('Diffusion',   r'$\partial_t c = D \nabla^2 c + S$',           COLORS['intrinsic']),
        ('Electricity', r'$\partial_t V = \frac{\sigma}{\epsilon} \nabla^2 V + S$', COLORS['domain_elec']),
        ('Elasticity',  r'$\partial_{tt} \mathbf{u} = \frac{E}{\rho} \nabla^2 \mathbf{u} + \mathbf{f}$', COLORS['domain_mech']),
        ('Fluids',      r'$\partial_t \mathbf{v} = \nu \nabla^2 \mathbf{v} + \mathbf{f}$', COLORS['domain_hydr']),
    ]

    n = len(domains)
    dom_x = 7.5
    dbw, dbh = 4.2, 0.50
    y_top = 4.0
    y_bot = 0.3
    spacing = (y_top - y_bot) / (n - 1)

    # Caption centered under the five domain boxes
    ax.text(dom_x, y_bot - 0.45, 'same structure, different coefficients',
            ha='center', va='top', fontsize=FONT['small'],
            color=COLORS['mid_gray'], fontstyle='italic')

    for i, (name, eq, color) in enumerate(domains):
        dy = y_top - i * spacing
        # Domain box
        dbox = FancyBboxPatch((dom_x - dbw/2, dy - dbh/2), dbw, dbh,
                               boxstyle="round,pad=0.06",
                               facecolor='white', edgecolor=color, lw=1.3)
        ax.add_patch(dbox)
        ax.text(dom_x - dbw/2 + 0.15, dy, f'{name}:',
                ha='left', va='center', fontsize=FONT['tiny'],
                color=color, fontweight='bold')
        ax.text(dom_x + 0.3, dy, eq,
                ha='center', va='center', fontsize=FONT['tiny'], color=COLORS['text'])

        # Individual arrow from evolution equation box to each domain box
        ax.annotate('',
                    xy=(dom_x - dbw/2, dy),
                    xytext=(left_x + ew/2 + 0.05, ey),
                    arrowprops=dict(arrowstyle='->', color=color, lw=1.0,
                                    alpha=0.5, connectionstyle='arc3,rad=0'))

    if save_path:
        fig.savefig(save_path, dpi=300, bbox_inches='tight', facecolor='white')
        print(f'  Saved: {save_path}')
    return fig


# =============================================================================
# MAIN
# =============================================================================

FIGURES = {
    'F1': ('fig_F1_cross_domain_RIC.png', figure_F1),
    'F2': ('fig_F2_heat_spectral.png', figure_F2),
    'F3': ('fig_F3_state_space_block.png', figure_F3),
    'F4': ('fig_F4_underdetermination.png', figure_F4),
    'F5': ('fig_F5_two_step_construction.png', figure_F5),
}

def main():
    out_dir = Path(__file__).parent
    requested = sys.argv[1:] if len(sys.argv) > 1 else list(FIGURES.keys())

    print(f'Generating DSL figures in: {out_dir}')
    for key in requested:
        key = key.upper()
        if key not in FIGURES:
            print(f'  Unknown figure: {key}. Available: {", ".join(FIGURES.keys())}')
            continue
        fname, func = FIGURES[key]
        path = out_dir / fname
        print(f'  Generating {key}...')
        fig = func(save_path=str(path))
        plt.close(fig)

    print('Done.')


if __name__ == '__main__':
    main()
