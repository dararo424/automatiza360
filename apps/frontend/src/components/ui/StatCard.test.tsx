import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renderiza titulo y valor', () => {
    render(<StatCard title="Órdenes" value={42} colorClass="border-indigo-500" />);
    expect(screen.getByText('Órdenes')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('muestra subtitle cuando se pasa', () => {
    render(
      <StatCard title="Ingresos" value="$1.000" subtitle="hoy" colorClass="border-green-500" />,
    );
    expect(screen.getByText('hoy')).toBeInTheDocument();
  });

  it('TrendBadge: muestra flecha arriba y porcentaje cuando current > previous', () => {
    render(
      <StatCard
        title="Ventas"
        value={100}
        colorClass="border-blue-500"
        trend={{ current: 100, previous: 50 }}
      />,
    );
    expect(screen.getByText(/↑ 100%/)).toBeInTheDocument();
  });

  it('TrendBadge: muestra flecha abajo cuando current < previous', () => {
    render(
      <StatCard
        title="Ventas"
        value={50}
        colorClass="border-blue-500"
        trend={{ current: 50, previous: 100 }}
      />,
    );
    expect(screen.getByText(/↓ 50%/)).toBeInTheDocument();
  });

  it('TrendBadge: NO renderiza si current y previous son ambos 0', () => {
    const { container } = render(
      <StatCard
        title="Ventas"
        value={0}
        colorClass="border-blue-500"
        trend={{ current: 0, previous: 0 }}
      />,
    );
    expect(container.querySelector('.bg-green-100, .bg-red-100')).toBeNull();
  });

  it('TrendBadge: muestra diff absoluto cuando previous es 0 y current > 0', () => {
    render(
      <StatCard
        title="Ventas"
        value={5}
        colorClass="border-blue-500"
        trend={{ current: 5, previous: 0 }}
      />,
    );
    expect(screen.getByText(/\+5/)).toBeInTheDocument();
  });

  it('TrendBadge: incluye label cuando se pasa', () => {
    render(
      <StatCard
        title="Ventas"
        value={100}
        colorClass="border-blue-500"
        trend={{ current: 100, previous: 80, label: 'vs ayer' }}
      />,
    );
    expect(screen.getByText(/vs ayer/)).toBeInTheDocument();
  });
});
