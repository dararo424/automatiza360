import { Injectable } from '@nestjs/common';

interface AppointmentData {
  id: string;
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  location?: string;
}

@Injectable()
export class CalendarService {
  generateGoogleCalendarUrl(data: Omit<AppointmentData, 'id'>): string {
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: data.title,
      dates: `${fmt(data.startDateTime)}/${fmt(data.endDateTime)}`,
      details: data.description,
      location: data.location ?? '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  generateOutlookUrl(data: Omit<AppointmentData, 'id'>): string {
    const fmt = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, '+00:00');

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: data.title,
      startdt: fmt(data.startDateTime),
      enddt: fmt(data.endDateTime),
      body: data.description,
      location: data.location ?? '',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  generateICSFile(data: AppointmentData): string {
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Automatiza360//ES',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${data.id}@automatiza360.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(data.startDateTime)}`,
      `DTEND:${fmt(data.endDateTime)}`,
      `SUMMARY:${this._esc(data.title)}`,
      `DESCRIPTION:${this._esc(data.description)}`,
      `LOCATION:${this._esc(data.location ?? '')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  private _esc(v: string): string {
    return v
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
}
