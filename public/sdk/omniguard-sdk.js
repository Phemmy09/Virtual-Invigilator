/**
 * OmniGuard AI - Elite Universal Proctoring SDK
 * Version: 2.4.0 (Ivy League Enterprise Standard)
 */
(function (window, document) {
  'use strict';

  var OmniGuard = {
    config: {
      serverUrl: 'http://localhost:3000',
      examId: null,
      studentId: null,
      matricNumber: null,
      subject: null,
      onViolation: null,
      strictLockdown: true,
    },

    iframeElement: null,
    containerElement: null,

    init: function (userConfig) {
      if (!userConfig) {
        console.error('[OmniGuard SDK] Configuration object required for init().');
        return;
      }
      for (var key in userConfig) {
        if (userConfig.hasOwnProperty(key)) {
          this.config[key] = userConfig[key];
        }
      }

      console.log('[OmniGuard SDK] Initializing Invigilator Suite for Exam:', this.config.examId);
      this.injectProctorWidget();
      this.bindBrowserSecurityListeners();
    },

    injectProctorWidget: function () {
      if (document.getElementById('omniguard-widget-container')) return;

      var container = document.createElement('div');
      container.id = 'omniguard-widget-container';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.width = '340px';
      container.style.height = '280px';
      container.style.zIndex = '999999';
      container.style.borderRadius = '16px';
      container.style.overflow = 'hidden';
      container.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.4)';
      container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.background = '#090d16';

      var iframe = document.createElement('iframe');
      var queryParams = [
        'examId=' + encodeURIComponent(this.config.examId || ''),
        'studentId=' + encodeURIComponent(this.config.studentId || ''),
        'matricNumber=' + encodeURIComponent(this.config.matricNumber || ''),
        'subject=' + encodeURIComponent(this.config.subject || ''),
        'embed=true'
      ].join('&');

      iframe.src = this.config.serverUrl + '/proctor?' + queryParams;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'camera; microphone; geolocation';

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
          self.reportViolation('tab_switch', 'medium', 'Student switched tabs or minimized window.');
        }
      });

      window.addEventListener('blur', function () {
        self.reportViolation('tab_switch', 'low', 'Window lost focus / second monitor clicked.');
      });

      if (this.config.strictLockdown) {
        // 2. Clipboard & Context Menu Lockdown
        document.addEventListener('contextmenu', function (e) {
          e.preventDefault();
          self.reportViolation('clipboard_attempt', 'low', 'Right-click context menu attempt blocked.');
        });

        document.addEventListener('copy', function (e) {
          e.preventDefault();
          self.reportViolation('clipboard_attempt', 'medium', 'Text copy attempt blocked.');
        });

        document.addEventListener('paste', function (e) {
          e.preventDefault();
          self.reportViolation('clipboard_attempt', 'medium', 'External text paste attempt blocked.');
        });

        // 3. DevTools & Hotkey Lockdown
        document.addEventListener('keydown', function (e) {
          if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'u')
          ) {
            e.preventDefault();
            self.reportViolation('keystroke_anomaly', 'critical', 'Developer Tools keyboard shortcut blocked.');
          }
        });
      }
    },

    reportViolation: function (eventType, severity, detailsText) {
      console.warn('[OmniGuard SDK] Violation detected:', eventType, detailsText);

      // Send to host app callback if provided
      if (typeof this.config.onViolation === 'function') {
        this.config.onViolation({
          eventType: eventType,
          severity: severity,
          details: detailsText,
          timestamp: new Date().toISOString(),
        });
      }

      // Relay to the iframe proctor
      if (this.iframeElement && this.iframeElement.contentWindow) {
        this.iframeElement.contentWindow.postMessage({
          type: 'OMNIGUARD_PARENT_VIOLATION',
          eventType: eventType,
          severity: severity,
          detailsText: detailsText
        }, '*');
      }
    },

    handleIframeMessage: function (event) {
      if (event.data && event.data.type === 'OMNIGUARD_WIDGET_ALERT') {
        if (typeof this.config.onViolation === 'function') {
          this.config.onViolation(event.data.payload);
        }
      }
    }
  };

  window.OmniGuard = OmniGuard;
})(window, document);
