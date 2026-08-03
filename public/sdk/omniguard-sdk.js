/**
 * OmniGuard AI - Enterprise Universal Proctoring & Face Identification SDK
 * Version: 3.1.0 (Ivy League Enterprise Standard)
 * Unified SDK: Proctoring Widget & Face Identification Widget
 * 
 * Target Webhook Endpoint:
 * POST https://examportalv2apitest.azurewebsites.net/api/v1/Proctor/flag
 * Header: TenantCode = MASTER
 */
(function (window, document) {
  'use strict';

  var serverOrigin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:3000';

  // 1. Proctor Widget Module
  var ProctorModule = {
    config: {
      serverUrl: serverOrigin,
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
      widgetPosition: 'bottom-right',
    },

    iframeElement: null,
    containerElement: null,

    init: function (userConfig) {
      if (userConfig) {
        for (var key in userConfig) {
          if (userConfig.hasOwnProperty(key)) {
            this.config[key] = userConfig[key];
          }
        }
      }
      this.injectProctorWidget();
      this.bindBrowserSecurityListeners();
      return this;
    },

    injectProctorWidget: function () {
      if (document.getElementById('omniguard-proctor-container')) return;

      var container = document.createElement('div');
      container.id = 'omniguard-proctor-container';
      container.style.position = 'fixed';
      container.style.zIndex = '999999';
      container.style.width = '340px';
      container.style.height = '280px';
      container.style.borderRadius = '16px';
      container.style.overflow = 'hidden';
      container.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(99, 102, 241, 0.4)';
      container.style.background = '#090d16';

      if (this.config.widgetPosition === 'top-right') {
        container.style.top = '20px';
        container.style.right = '20px';
      } else if (this.config.widgetPosition === 'bottom-left') {
        container.style.bottom = '20px';
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

      document.addEventListener('fullscreenchange', function () {
        if (!document.fullscreenElement) {
          self.reportViolation('EXIT_FULLSCREEN', 'critical', 'Student exited full screen mode.');
          self.reportViolation('FULLSCREEN_CHANGE', 'medium', 'Full screen state changed to windowed.');
        } else {
          self.reportViolation('FULLSCREEN_CHANGE', 'low', 'Full screen mode entered.');
        }
      });
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

      if (typeof this.config.onFlag === 'function') this.config.onFlag(violationData);
      if (typeof this.config.onViolation === 'function') this.config.onViolation(violationData);

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
      if (this.iframeElement && this.iframeElement.contentWindow) {
        this.iframeElement.contentWindow.postMessage({ type: 'OMNIGUARD_REQUEST_REPORT' }, '*');
      }
    },

    handleIframeMessage: function (event) {
      if (!event.data) return;
      if (event.data.type === 'OMNIGUARD_WIDGET_ALERT') {
        if (typeof this.config.onFlag === 'function') this.config.onFlag(event.data.payload);
        if (typeof this.config.onViolation === 'function') this.config.onViolation(event.data.payload);
      } else if (event.data.type === 'OMNIGUARD_EXAM_REPORT') {
        if (typeof this.config.onReport === 'function') this.config.onReport(event.data.report);
      }
    },

    destroy: function () {
      if (this.containerElement && this.containerElement.parentNode) {
        this.containerElement.parentNode.removeChild(this.containerElement);
      }
      this.iframeElement = null;
      this.containerElement = null;
    }
  };

  // 2. Face Identification Module
  var FaceIdModule = {
    config: {
      serverUrl: serverOrigin,
      candidateId: 'a5c69632941a4c99ad0d028e64eac468',
      examId: '568',
      tenantCode: 'MASTER',
      domain: 'AI_TESTING',
      event: 'AI_FLAG',
      candidateName: 'Alex Mercer',
      mode: 'verify',
      onVerified: null,
      onCaptured: null,
      onFlag: null,
      widgetPosition: 'center-modal',
      targetContainerId: null,
    },

    iframeElement: null,
    containerElement: null,

    init: function (userConfig) {
      if (userConfig) {
        for (var key in userConfig) {
          if (userConfig.hasOwnProperty(key)) {
            this.config[key] = userConfig[key];
          }
        }
      }
      this.injectFaceIdWidget();
      return this;
    },

    injectFaceIdWidget: function () {
      if (document.getElementById('omniguard-faceid-container')) return;

      var queryParams = [
        'candidateId=' + encodeURIComponent(this.config.candidateId || 'a5c69632941a4c99ad0d028e64eac468'),
        'examId=' + encodeURIComponent(this.config.examId || '568'),
        'tenantCode=' + encodeURIComponent(this.config.tenantCode || 'MASTER'),
        'domain=' + encodeURIComponent(this.config.domain || 'AI_TESTING'),
        'event=' + encodeURIComponent(this.config.event || 'AI_FLAG'),
        'candidateName=' + encodeURIComponent(this.config.candidateName || ''),
        'mode=' + encodeURIComponent(this.config.mode || 'verify'),
        'embed=true'
      ].join('&');

      var iframe = document.createElement('iframe');
      iframe.src = this.config.serverUrl + '/face-id?' + queryParams;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'camera; microphone; geolocation';

      if (this.config.targetContainerId) {
        var targetElem = document.getElementById(this.config.targetContainerId);
        if (targetElem) {
          targetElem.appendChild(iframe);
          this.iframeElement = iframe;
          this.containerElement = targetElem;
          window.addEventListener('message', this.handleIframeMessage.bind(this), false);
          return;
        }
      }

      var container = document.createElement('div');
      container.id = 'omniguard-faceid-container';
      container.style.position = 'fixed';
      container.style.zIndex = '999999';
      container.style.width = '360px';
      container.style.height = '320px';
      container.style.borderRadius = '16px';
      container.style.overflow = 'hidden';
      container.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(6, 182, 212, 0.5)';
      container.style.background = '#090d16';

      if (this.config.widgetPosition === 'top-right') {
        container.style.top = '20px';
        container.style.right = '20px';
      } else if (this.config.widgetPosition === 'bottom-left') {
        container.style.bottom = '20px';
        container.style.left = '20px';
      } else {
        container.style.bottom = '20px';
        container.style.right = '20px';
      }

      container.appendChild(iframe);
      document.body.appendChild(container);

      this.iframeElement = iframe;
      this.containerElement = container;

      window.addEventListener('message', this.handleIframeMessage.bind(this), false);
    },

    handleIframeMessage: function (event) {
      if (!event.data) return;
      if (event.data.type === 'OMNIGUARD_FACE_CAPTURED' || event.data.type === 'OMNIGUARD_FACE_VERIFIED') {
        if (typeof this.config.onCaptured === 'function') this.config.onCaptured(event.data);
        if (typeof this.config.onVerified === 'function') this.config.onVerified(event.data);
      } else if (event.data.type === 'OMNIGUARD_WIDGET_ALERT') {
        if (typeof this.config.onFlag === 'function') this.config.onFlag(event.data.payload);
      }
    },

    destroy: function () {
      if (this.containerElement && this.containerElement.parentNode) {
        this.containerElement.parentNode.removeChild(this.containerElement);
      }
      this.iframeElement = null;
      this.containerElement = null;
    }
  };

  var OmniGuard = {
    Proctor: ProctorModule,
    FaceId: FaceIdModule,
    init: function (userConfig) {
      return ProctorModule.init(userConfig);
    },
    startExam: function () {
      return ProctorModule.finishExam();
    },
    finishExam: function (cb) {
      return ProctorModule.finishExam(cb);
    },
    reportViolation: function (type, sev, det) {
      return ProctorModule.reportViolation(type, sev, det);
    },
    destroy: function () {
      ProctorModule.destroy();
      FaceIdModule.destroy();
    }
  };

  window.OmniGuard = OmniGuard;
  window.OmniGuardProctor = ProctorModule;
  window.OmniGuardFaceId = FaceIdModule;
})(window, document);
