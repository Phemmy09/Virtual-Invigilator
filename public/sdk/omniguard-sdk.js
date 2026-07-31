/**
 * OmniGuard AI - Elite Universal Proctoring SDK
 * Version: 3.0.0 (Ivy League Enterprise Standard)
 * Embeddable Proctoring Widget & Real-time Media Evidence Reporter
 */
(function (window, document) {
  'use strict';

  var OmniGuard = {
    config: {
      serverUrl: window.location.origin || 'http://localhost:3000',
      examId: 'default-exam',
      studentId: 'default-student',
      matricNumber: '',
      studentName: '',
      subject: 'CS50 - Artificial Intelligence',
      onViolation: null,
      onReport: null,
      strictLockdown: true,
      widgetPosition: 'bottom-right', // 'bottom-right' | 'top-right' | 'bottom-left'
    },

    iframeElement: null,
    containerElement: null,
    latestReport: null,
    reportCallbacks: [],

    init: function (userConfig) {
      if (userConfig) {
        for (var key in userConfig) {
          if (userConfig.hasOwnProperty(key)) {
            this.config[key] = userConfig[key];
          }
        }
      }

      console.log('[OmniGuard SDK v3.0] Initializing Embedded Invigilator Suite for Exam:', this.config.examId);
      this.injectProctorWidget();
      this.bindBrowserSecurityListeners();
      return this;
    },

    injectProctorWidget: function () {
      if (document.getElementById('omniguard-widget-container')) {
        console.warn('[OmniGuard SDK] Widget container already exists.');
        return;
      }

      var container = document.createElement('div');
      container.id = 'omniguard-widget-container';
      container.style.position = 'fixed';
      container.style.zIndex = '999999';
      container.style.width = '340px';
      container.style.height = '280px';
      container.style.borderRadius = '16px';
      container.style.overflow = 'hidden';
      container.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(99, 102, 241, 0.4)';
      container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.background = '#090d16';

      if (this.config.widgetPosition === 'top-right') {
        container.style.top = '20px';
        container.style.right = '20px';
      } else if (this.config.widgetPosition === 'bottom-left') {
        container.style.bottom = '20px';
        container.style.left = '20px';
      } else {
        // default bottom-right
        container.style.bottom = '20px';
        container.style.right = '20px';
      }

      var iframe = document.createElement('iframe');
      var queryParams = [
        'examId=' + encodeURIComponent(this.config.examId || ''),
        'studentId=' + encodeURIComponent(this.config.studentId || ''),
        'matricNumber=' + encodeURIComponent(this.config.matricNumber || ''),
        'studentName=' + encodeURIComponent(this.config.studentName || ''),
        'subject=' + encodeURIComponent(this.config.subject || ''),
        'embed=true'
      ].join('&');

      iframe.src = this.config.serverUrl + '/proctor?' + queryParams;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'camera; microphone; geolocation; display-capture';

      container.appendChild(iframe);
      document.body.appendChild(container);

      this.iframeElement = iframe;
      this.containerElement = container;

      // Listen for postMessage from the iframe widget
      window.addEventListener('message', this.handleIframeMessage.bind(this), false);
    },

    bindBrowserSecurityListeners: function () {
      var self = this;

      // 1. Tab Switching & Window Focus Loss
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          self.reportViolation('tab_switch', 'medium', 'Student switched browser tab or minimized window.');
        }
      });

      window.addEventListener('blur', function () {
        self.reportViolation('tab_switch', 'low', 'Window lost focus (secondary screen click or desktop window switch).');
      });

      if (this.config.strictLockdown) {
        // 2. Context Menu & Clipboard Lockdown
        document.addEventListener('contextmenu', function (e) {
          e.preventDefault();
          self.reportViolation('clipboard_attempt', 'low', 'Right-click context menu blocked.');
        });

        document.addEventListener('copy', function (e) {
          e.preventDefault();
          self.reportViolation('clipboard_attempt', 'medium', 'Copy action blocked.');
        });

        document.addEventListener('paste', function (e) {
          e.preventDefault();
          self.reportViolation('clipboard_attempt', 'medium', 'External paste action blocked.');
        });

        // 3. DevTools & Keyboard Shortcuts Lockdown
        document.addEventListener('keydown', function (e) {
          if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u')
          ) {
            e.preventDefault();
            self.reportViolation('keystroke_anomaly', 'critical', 'Developer Tools hotkey attempt blocked.');
          }
        });
      }
    },

    reportViolation: function (eventType, severity, detailsText) {
      console.warn('[OmniGuard SDK] Violation detected:', eventType, detailsText);

      var violationData = {
        eventType: eventType,
        severity: severity,
        details: detailsText,
        timestamp: new Date().toISOString(),
      };

      if (typeof this.config.onViolation === 'function') {
        this.config.onViolation(violationData);
      }

      if (this.iframeElement && this.iframeElement.contentWindow) {
        this.iframeElement.contentWindow.postMessage({
          type: 'OMNIGUARD_PARENT_VIOLATION',
          eventType: eventType,
          severity: severity,
          detailsText: detailsText
        }, '*');
      }
    },

    startExam: function () {
      console.log('[OmniGuard SDK] Starting active exam monitoring.');
      if (this.iframeElement && this.iframeElement.contentWindow) {
        this.iframeElement.contentWindow.postMessage({
          type: 'OMNIGUARD_START_EXAM'
        }, '*');
      }
    },

    finishExam: function (callback) {
      console.log('[OmniGuard SDK] Requesting post-exam audit report...');
      var self = this;

      if (callback && typeof callback === 'function') {
        this.reportCallbacks.push(callback);
      }

      if (this.iframeElement && this.iframeElement.contentWindow) {
        this.iframeElement.contentWindow.postMessage({
          type: 'OMNIGUARD_REQUEST_REPORT'
        }, '*');
      } else {
        console.error('[OmniGuard SDK] Proctor iframe not found.');
      }
    },

    getReport: function () {
      return this.latestReport;
    },

    exportReport: function (format) {
      var report = this.getReport();
      if (!report) {
        alert('No audit report generated yet. Call finishExam() first.');
        return;
      }
      var jsonStr = JSON.stringify(report, null, 2);
      var blob = new Blob([jsonStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'OmniGuard_Audit_Report_' + (report.studentId || 'candidate') + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    handleIframeMessage: function (event) {
      if (!event.data) return;

      if (event.data.type === 'OMNIGUARD_WIDGET_ALERT') {
        if (typeof this.config.onViolation === 'function') {
          this.config.onViolation(event.data.payload);
        }
      } else if (event.data.type === 'OMNIGUARD_EXAM_REPORT') {
        console.log('[OmniGuard SDK] Exam report payload received:', event.data.report);
        this.latestReport = event.data.report;

        if (typeof this.config.onReport === 'function') {
          this.config.onReport(event.data.report);
        }

        while (this.reportCallbacks.length > 0) {
          var cb = this.reportCallbacks.shift();
          cb(event.data.report);
        }
      }
    },

    destroy: function () {
      if (this.containerElement && this.containerElement.parentNode) {
        this.containerElement.parentNode.removeChild(this.containerElement);
      }
      this.iframeElement = null;
      this.containerElement = null;
      console.log('[OmniGuard SDK] Invigilator widget destroyed.');
    }
  };

  window.OmniGuard = OmniGuard;
})(window, document);
