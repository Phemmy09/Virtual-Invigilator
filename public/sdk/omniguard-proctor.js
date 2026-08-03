/**
 * OmniGuard AI - Enterprise Proctoring Widget SDK
 * Version: 3.1.0
 * Embeddable Live Invigilator Widget & Webhook Telemetry Engine
 * 
 * Target Webhook Endpoint:
 * POST https://examportalv2apitest.azurewebsites.net/api/v1/Proctor/flag
 * Header: TenantCode = MASTER
 */
(function (window, document) {
  'use strict';

  var OmniGuardProctor = {
    config: {
      serverUrl: (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:3000',
      examId: '568',
      candidateId: 'a5c69632941a4c99ad0d028e64eac468',
      tenantCode: 'MASTER',
      domain: 'AI_TESTING',
      event: 'AI_FLAG',
      studentName: 'Alex Mercer',
      subject: 'CS50 - Artificial Intelligence',
      onFlag: null,
      onViolation: null,
      onReport: null,
      strictLockdown: true,
      widgetPosition: 'bottom-right', // 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'
      width: '340px',
      height: '280px',
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

      console.log('[OmniGuard Proctor SDK] Initializing Proctor Widget for Candidate:', this.config.candidateId, 'Exam:', this.config.examId);
      this.injectProctorWidget();
      this.bindBrowserSecurityListeners();
      return this;
    },

    injectProctorWidget: function () {
      if (document.getElementById('omniguard-proctor-container')) {
        console.warn('[OmniGuard Proctor SDK] Container already injected.');
        return;
      }

      var container = document.createElement('div');
      container.id = 'omniguard-proctor-container';
      container.style.position = 'fixed';
      container.style.zIndex = '999999';
      container.style.width = this.config.width || '340px';
      container.style.height = this.config.height || '280px';
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
      } else if (this.config.widgetPosition === 'top-left') {
        container.style.top = '20px';
        container.style.left = '20px';
      } else {
        container.style.bottom = '20px';
        container.style.right = '20px';
      }

      var queryParams = [
        'examId=' + encodeURIComponent(this.config.examId || '568'),
        'candidateId=' + encodeURIComponent(this.config.candidateId || 'a5c69632941a4c99ad0d028e64eac468'),
        'tenantCode=' + encodeURIComponent(this.config.tenantCode || 'MASTER'),
        'domain=' + encodeURIComponent(this.config.domain || 'AI_TESTING'),
        'event=' + encodeURIComponent(this.config.event || 'AI_FLAG'),
        'studentName=' + encodeURIComponent(this.config.studentName || ''),
        'subject=' + encodeURIComponent(this.config.subject || ''),
        'embed=true'
      ].join('&');

      var iframe = document.createElement('iframe');
      iframe.src = this.config.serverUrl + '/proctor?' + queryParams;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'camera; microphone; geolocation; display-capture';

      container.appendChild(iframe);
      document.body.appendChild(container);

      this.iframeElement = iframe;
      this.containerElement = container;

      window.addEventListener('message', this.handleIframeMessage.bind(this), false);
    },

    bindBrowserSecurityListeners: function () {
      var self = this;

      // 1. Tab Focus & Visibility Listeners
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          self.reportViolation('TAB_NOT_FOCUS', 'medium', 'Student switched browser tab or minimized window.');
          self.reportViolation('TAB_FOCUS_CHANGE', 'low', 'Tab focus state changed to hidden.');
        } else {
          self.reportViolation('TAB_FOCUS_CHANGE', 'low', 'Tab focus state returned to active.');
        }
      });

      window.addEventListener('blur', function () {
        self.reportViolation('TAB_NOT_FOCUS', 'low', 'Window lost active focus.');
        self.reportViolation('TAB_FOCUS_CHANGE', 'low', 'Window blur event triggered.');
      });

      // 2. Fullscreen Change Listeners
      document.addEventListener('fullscreenchange', function () {
        if (!document.fullscreenElement) {
          self.reportViolation('EXIT_FULLSCREEN', 'critical', 'Student exited full screen mode.');
          self.reportViolation('FULLSCREEN_CHANGE', 'medium', 'Full screen state changed to windowed.');
        } else {
          self.reportViolation('FULLSCREEN_CHANGE', 'low', 'Full screen mode entered.');
        }
      });

      if (this.config.strictLockdown) {
        // 3. Context Menu & Clipboard Lockdown
        document.addEventListener('contextmenu', function (e) {
          e.preventDefault();
          self.reportViolation('SUSPICIOUS_ACTIVITY', 'low', 'Right-click context menu attempt blocked.');
        });

        document.addEventListener('copy', function (e) {
          e.preventDefault();
          self.reportViolation('SUSPICIOUS_ACTIVITY', 'medium', 'Copy action blocked.');
        });

        document.addEventListener('paste', function (e) {
          e.preventDefault();
          self.reportViolation('SUSPICIOUS_ACTIVITY', 'medium', 'External paste action blocked.');
        });

        // 4. DevTools Lockdown
        document.addEventListener('keydown', function (e) {
          if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u')
          ) {
            e.preventDefault();
            self.reportViolation('SUSPICIOUS_ACTIVITY', 'critical', 'Developer Tools hotkey attempt blocked.');
          }
        });
      }
    },

    reportViolation: function (eventType, severity, detailsText) {
      var violationData = {
        eventType: eventType,
        severity: severity,
        detailsText: detailsText,
        candidateId: this.config.candidateId,
        examId: this.config.examId,
        timestamp: new Date().toISOString(),
      };

      if (typeof this.config.onFlag === 'function') {
        this.config.onFlag(violationData);
      }
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

    finishExam: function (callback) {
      if (callback && typeof callback === 'function') {
        this.reportCallbacks.push(callback);
      }
      if (this.iframeElement && this.iframeElement.contentWindow) {
        this.iframeElement.contentWindow.postMessage({
          type: 'OMNIGUARD_REQUEST_REPORT'
        }, '*');
      }
    },

    handleIframeMessage: function (event) {
      if (!event.data) return;

      if (event.data.type === 'OMNIGUARD_WIDGET_ALERT') {
        if (typeof this.config.onFlag === 'function') {
          this.config.onFlag(event.data.payload);
        }
        if (typeof this.config.onViolation === 'function') {
          this.config.onViolation(event.data.payload);
        }
      } else if (event.data.type === 'OMNIGUARD_EXAM_REPORT') {
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
      console.log('[OmniGuard Proctor SDK] Widget destroyed.');
    }
  };

  window.OmniGuardProctor = OmniGuardProctor;
})(window, document);
