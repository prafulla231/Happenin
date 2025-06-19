import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as echarts from 'echarts';
import { LoadingService } from '../loading';
import { EventService } from '../../services/event';
import { LocationService } from '../../services/location';
import { HeaderComponent, HeaderButton } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { NgChartsModule } from 'ng2-charts';

export interface AnalyticsData {
  totalEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  averageEventCapacity: number;
  categoryDistribution: { [key: string]: number };
  monthlyEventTrends: { month: string; events: number; registrations: number; revenue: number }[];
  locationPerformance: { location: string; events: number; registrations: number; revenue: number }[];
  priceRangeDistribution: { range: string; count: number; revenue: number }[];
  eventStatusBreakdown: { status: string; count: number; percentage: number }[];
  topPerformingEvents: { title: string; registrations: number; revenue: number; capacity: number }[];
  registrationTrends: { date: string; registrations: number }[];
  capacityUtilization: { eventTitle: string; utilized: number; total: number; percentage: number }[];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './admin-analytics.html',
  styleUrls: ['./admin-analytics.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  
  analyticsData: AnalyticsData = {
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    averageEventCapacity: 0,
    categoryDistribution: {},
    monthlyEventTrends: [],
    locationPerformance: [],
    priceRangeDistribution: [],
    eventStatusBreakdown: [],
    topPerformingEvents: [],
    registrationTrends: [],
    capacityUtilization: []
  };

  private charts: { [key: string]: echarts.ECharts } = {};
  private resizeObserver: ResizeObserver | null = null;

  adminButtons: HeaderButton[] = [
    { text: 'Dashboard', action: 'dashboard' },
    { text: 'Export Data', action: 'exportData', style: 'secondary' },
    { text: 'Refresh', action: 'refresh', style: 'secondary' },
    { text: 'Logout', action: 'logout', style: 'primary' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private loadingService: LoadingService,
    private eventService: EventService,
    private locationService: LocationService
  ) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.setupResizeObserver();
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.initializeAllCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    // Dispose all charts
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.dispose();
      }
    });
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  handleHeaderAction(action: string): void {
    switch (action) {
      case 'dashboard':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'exportData':
        this.exportAnalyticsData();
        break;
      case 'refresh':
        this.refreshData();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      Object.values(this.charts).forEach(chart => {
        if (chart) {
          chart.resize();
        }
      });
    });
  }

  loadAnalyticsData(): void {
    this.loadingService.show();
    
    // Load all events data
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.processEventsData(events);
        
        // Load expired events
        this.eventService.getExpiredEvents().subscribe({
          next: (expiredEvents) => {
            this.processExpiredEventsData(expiredEvents);
            this.loadingService.hide();
            
            // Initialize charts after data is loaded
            setTimeout(() => {
              this.initializeAllCharts();
            }, 100);
          },
          error: (err) => {
            console.error('Error loading expired events', err);
            this.loadingService.hide();
          }
        });
      },
      error: (err) => {
        console.error('Error loading events', err);
        this.loadingService.hide();
      }
    });
  }

  private processEventsData(events: any[]): void {
    this.analyticsData.totalEvents = events.length;
    
    // Process category distribution
    const categoryCount: { [key: string]: number } = {};
    let totalRegistrations = 0;
    let totalRevenue = 0;
    let totalCapacity = 0;
    
    const monthlyData: { [key: string]: { events: number; registrations: number; revenue: number } } = {};
    const locationData: { [key: string]: { events: number; registrations: number; revenue: number } } = {};
    const priceRanges = {
      'Free': { count: 0, revenue: 0 },
      '₹1-500': { count: 0, revenue: 0 },
      '₹501-1000': { count: 0, revenue: 0 },
      '₹1001-2000': { count: 0, revenue: 0 },
      '₹2000+': { count: 0, revenue: 0 }
    };

    events.forEach(event => {
      // Category distribution
      if (event.category) {
        categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
      }

      // Monthly trends
      const eventDate = new Date(event.date);
      const monthKey = eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { events: 0, registrations: 0, revenue: 0 };
      }
      monthlyData[monthKey].events += 1;
      
      // Simulate registration data (replace with real data from your API)
      const registrationCount = Math.floor(Math.random() * event.maxRegistrations);
      monthlyData[monthKey].registrations += registrationCount;
      monthlyData[monthKey].revenue += event.price * registrationCount;
      
      totalRegistrations += registrationCount;
      totalRevenue += event.price * registrationCount;
      totalCapacity += event.maxRegistrations;

      // Location performance
      const locationCity = this.extractCityFromLocation(event.location);
      if (!locationData[locationCity]) {
        locationData[locationCity] = { events: 0, registrations: 0, revenue: 0 };
      }
      locationData[locationCity].events += 1;
      locationData[locationCity].registrations += registrationCount;
      locationData[locationCity].revenue += event.price * registrationCount;

      // Price range distribution
      if (event.price === 0) {
        priceRanges['Free'].count += 1;
      } else if (event.price <= 500) {
        priceRanges['₹1-500'].count += 1;
        priceRanges['₹1-500'].revenue += event.price * registrationCount;
      } else if (event.price <= 1000) {
        priceRanges['₹501-1000'].count += 1;
        priceRanges['₹501-1000'].revenue += event.price * registrationCount;
      } else if (event.price <= 2000) {
        priceRanges['₹1001-2000'].count += 1;
        priceRanges['₹1001-2000'].revenue += event.price * registrationCount;
      } else {
        priceRanges['₹2000+'].count += 1;
        priceRanges['₹2000+'].revenue += event.price * registrationCount;
      }
    });

    this.analyticsData.categoryDistribution = categoryCount;
    this.analyticsData.totalRegistrations = totalRegistrations;
    this.analyticsData.totalRevenue = totalRevenue;
    this.analyticsData.averageEventCapacity = totalCapacity / events.length || 0;

    // Convert monthly data to array
    this.analyticsData.monthlyEventTrends = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Convert location data to array
    this.analyticsData.locationPerformance = Object.entries(locationData)
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Convert price range data
    this.analyticsData.priceRangeDistribution = Object.entries(priceRanges)
      .map(([range, data]) => ({ range, ...data }));

    // Generate top performing events
    this.analyticsData.topPerformingEvents = events
      .map(event => ({
        title: event.title,
        registrations: Math.floor(Math.random() * event.maxRegistrations),
        revenue: event.price * Math.floor(Math.random() * event.maxRegistrations),
        capacity: event.maxRegistrations
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  private processExpiredEventsData(expiredEvents: any[]): void {
    // Process event status breakdown
    const totalEvents = this.analyticsData.totalEvents + expiredEvents.length;
    this.analyticsData.eventStatusBreakdown = [
      {
        status: 'Active',
        count: this.analyticsData.totalEvents,
        percentage: (this.analyticsData.totalEvents / totalEvents) * 100
      },
      {
        status: 'Expired',
        count: expiredEvents.length,
        percentage: (expiredEvents.length / totalEvents) * 100
      }
    ];
  }

  private extractCityFromLocation(location: string): string {
    if (!location) return 'Unknown';
    const parts = location.split(',');
    return parts.length >= 2 ? parts[parts.length - 2].trim() : parts[0].trim();
  }

  private initializeAllCharts(): void {
    this.initializeOverviewChart();
    this.initializeCategoryChart();
    this.initializeMonthlyTrendsChart();
    this.initializeLocationPerformanceChart();
    this.initializePriceRangeChart();
    this.initializeEventStatusChart();
    this.initializeTopEventsChart();
    this.initializeCapacityUtilizationChart();
  }

  private initializeOverviewChart(): void {
    const chartDom = document.getElementById('overviewChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    this.charts['overview'] = myChart;

    const option = {
      title: {
        text: 'Key Performance Indicators',
        left: 'center',
        textStyle: { color: '#333', fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'gauge',
          center: ['25%', '60%'],
          radius: '50%',
          detail: { formatter: '{value}' },
          data: [{ value: this.analyticsData.totalEvents, name: 'Total Events' }],
          axisLine: { lineStyle: { color: [[1, '#4CAF50']] } }
        },
        {
          type: 'gauge',
          center: ['75%', '60%'],
          radius: '50%',
          max: Math.max(this.analyticsData.totalRegistrations, 1000),
          detail: { formatter: '{value}' },
          data: [{ value: this.analyticsData.totalRegistrations, name: 'Registrations' }],
          axisLine: { lineStyle: { color: [[1, '#2196F3']] } }
        }
      ]
    };

    myChart.setOption(option);
    this.setupChartResize('overview');
  }

  private initializeCategoryChart(): void {
    const chartDom = document.getElementById('categoryChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    this.charts['category'] = myChart;

    const data = Object.entries(this.analyticsData.categoryDistribution).map(([name, value]) => ({
      name,
      value
    }));

    const option = {
      title: {
        text: 'Event Categories Distribution',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle'
      },
      series: [
        {
          name: 'Categories',
          type: 'pie',
          radius: '50%',
          center: ['60%', '50%'],
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          animationType: 'scale',
          animationEasing: 'elasticOut'
        }
      ]
    };

    myChart.setOption(option);
    this.setupChartResize('category');
  }

  private initializeMonthlyTrendsChart(): void {
    const chartDom = document.getElementById('monthlyTrendsChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    this.charts['monthlyTrends'] = myChart;

    const months = this.analyticsData.monthlyEventTrends.map(item => item.month);
    const events = this.analyticsData.monthlyEventTrends.map(item => item.events);
    const registrations = this.analyticsData.monthlyEventTrends.map(item => item.registrations);
    const revenue = this.analyticsData.monthlyEventTrends.map(item => item.revenue);

    const option = {
      title: {
        text: 'Monthly Performance Trends',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Events', 'Registrations', 'Revenue'],
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: months,
        axisPointer: { type: 'shadow' }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Count',
          position: 'left'
        },
        {
          type: 'value',
          name: 'Revenue (₹)',
          position: 'right'
        }
      ],
      series: [
        {
          name: 'Events',
          type: 'bar',
          data: events,
          itemStyle: { color: '#4CAF50' }
        },
        {
          name: 'Registrations',
          type: 'bar',
          data: registrations,
          itemStyle: { color: '#2196F3' }
        },
        {
          name: 'Revenue',
          type: 'line',
          yAxisIndex: 1,
          data: revenue,
          itemStyle: { color: '#FF9800' },
          lineStyle: { width: 3 }
        }
      ]
    };

    myChart.setOption(option);
    this.setupChartResize('monthlyTrends');
  }

  private initializeLocationPerformanceChart(): void {
    const chartDom = document.getElementById('locationChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    this.charts['location'] = myChart;

    const locations = this.analyticsData.locationPerformance.slice(0, 10).map(item => item.location);
    const revenue = this.analyticsData.locationPerformance.slice(0, 10).map(item => item.revenue);

    const option = {
      title: {
        text: 'Top Performing Locations',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      xAxis: {
        type: 'category',
        data: locations,
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: 'Revenue (₹)'
      },
      series: [
        {
          type: 'bar',
          data: revenue,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#9C27B0' },
              { offset: 1, color: '#E91E63' }
            ])
          },
          emphasis: {
            itemStyle: { color: '#673AB7' }
          }
        }
      ]
    };

    myChart.setOption(option);
    this.setupChartResize('location');
  }

  private initializePriceRangeChart(): void {
    const chartDom = document.getElementById('priceRangeChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    this.charts['priceRange'] = myChart;

    const ranges = this.analyticsData.priceRangeDistribution.map(item => item.range);
    const counts = this.analyticsData.priceRangeDistribution.map(item => item.count);

    const option = {
      title: {
        text: 'Price Range Distribution',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ranges
      },
      yAxis: {
        type: 'value',
        name: 'Number of Events'
      },
      series: [
        {
          type: 'bar',
          data: counts,
          itemStyle: { color: '#00BCD4' },
          emphasis: { itemStyle: { color: '#009688' } }
        }
      ]
    };

    myChart.setOption(option);
    this.setupChartResize('priceRange');
  }

  private initializeEventStatusChart(): void {
    const chartDom = document.getElementById('eventStatusChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    this.charts['eventStatus'] = myChart;

    const data = this.analyticsData.eventStatusBreakdown.map(item => ({
      name: item.status,
      value: item.count
    }));

    const option = {
      title: {
        text: 'Event Status Overview',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [
        {
          name: 'Event Status',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '60%'],
          data: data,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          }
        }
      ]
    };

    myChart.setOption(option);
    this.setupChartResize('eventStatus');
  }

  private initializeTopEventsChart(): void {
    const chartDom = document.getElementById('topEventsChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    this.charts['topEvents'] = myChart;

    const eventTitles = this.analyticsData.topPerformingEvents.slice(0, 8).map(item => 
      item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title
    );
    const revenues = this.analyticsData.topPerformingEvents.slice(0, 8).map(item => item.revenue);

    const option = {
      title: {
        text: 'Top Performing Events',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      yAxis: {
        type: 'category',
        data: eventTitles,
        axisLabel: { fontSize: 10 }
      },
      xAxis: {
        type: 'value',
        name: 'Revenue (₹)'
      },
      series: [
        {
          type: 'bar',
          data: revenues,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: '#FF6B6B' },
              { offset: 1, color: '#4ECDC4' }
            ])
          }
        }
      ]
    };

    myChart.setOption(option);
    this.setupChartResize('topEvents');
  }

  private initializeCapacityUtilizationChart(): void {
    const chartDom = document.getElementById('capacityChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    this.charts['capacity'] = myChart;

    // Generate sample capacity utilization data
    const capacityData = this.analyticsData.topPerformingEvents.slice(0, 6).map(event => ({
      eventTitle: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
      utilized: event.registrations,
      total: event.capacity,
      percentage: (event.registrations / event.capacity) * 100
    }));

    const eventNames = capacityData.map(item => item.eventTitle);
    const utilizationRates = capacityData.map(item => item.percentage);

    const option = {
      title: {
        text: 'Capacity Utilization Rate',
        left: 'center',
        textStyle: { color: '#333', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          const data = capacityData[params[0].dataIndex];
          return `${data.eventTitle}<br/>
                  Utilized: ${data.utilized}/${data.total}<br/>
                  Rate: ${params[0].value.toFixed(1)}%`;
        }
      },
      xAxis: {
        type: 'category',
        data: eventNames,
        axisLabel: { rotate: 30, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        name: 'Utilization %',
        max: 100
      },
      series: [
        {
          type: 'bar',
          data: utilizationRates,
          itemStyle: {
            color: function(params: any) {
              const value = params.value;
              if (value >= 80) return '#4CAF50';
              if (value >= 60) return '#FF9800';
              return '#F44336';
            }
          },
          markLine: {
            data: [{ yAxis: 75, name: 'Target: 75%' }],
            lineStyle: { color: '#666', type: 'dashed' }
          }
        }
      ]
    };

    myChart.setOption(option);
    this.setupChartResize('capacity');
  }

  private setupChartResize(chartKey: string): void {
    if (this.resizeObserver && this.charts[chartKey]) {
      const chartElement = document.getElementById(chartKey + 'Chart');
      if (chartElement) {
        this.resizeObserver.observe(chartElement);
      }
    }
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }

  exportAnalyticsData(): void {
    const dataStr = JSON.stringify(this.analyticsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}