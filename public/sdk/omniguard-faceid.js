/**
 * OmniGuard AI - Enterprise Face Identification Widget SDK
 * Version: 3.1.0
 * Embeddable Face Identification & Biometric Identity Verification Engine
 * 
 * Target Webhook Endpoint:
 * POST https://examportalv2apitest.azurewebsites.net/api/v1/Proctor/flag
 * Header: TenantCode = MASTER
 */
(function (window, document) {
  'use strict';

  var OmniGuardFaceId = {
    config: {
      serverUrl: (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'http://localhost:3000',
      candidateId: 'a5c69632941a4c99ad0d028e64eac468',
      examId: '568',
      tenantCode: 'MASTER',
      domain: 'AI_TESTING',
      event: 'AI_FLAG',
      candidateName: 'Alex Mercer',
      mode: 'verify', // 'verify' | 'enroll' | 'identify'
      onVerified: null,
      onCaptured: null,
      onFlag: null,
      widgetPosition: 'center-modal', // 'center-modal' | 'bottom-right' | 'inline'
      targetContainerId: null, // HTML element ID for inline rendering
      width: '360px',
      height: '320px',
    },

    iframeElement: null,
    containerElement: null,
    overlayElement: null,

    init: function (userConfig) {
      if (userConfig) {
        for (var key in userConfig) {
          if (userConfig.hasOwnProperty(key)) {
            this.config[key] = userConfig[key];
          }
        }
      }

      console.log('[OmniGuard FaceID SDK] Initializing Face Identification Widget for Candidate:', this.config.candidateId);
      this.injectFaceIdWidget();
      return this;
    },

    injectFaceIdWidget: function () {
      if (document.getElementById('omniguard-faceid-container')) {
        console.warn('[OmniGuard FaceID SDK] Widget already injected.');
        return;
      }

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
      container.style.width = this.config.width || '360px';
      container.style.height = this.config.height || '320px';
      container.style.borderRadius = '16px';
      container.style.overflow = 'hidden';
      container.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(6, 182, 212, 0.5)';
      container.style.background = '#090d16';

      if (this.config.widgetPosition === 'center-modal') {
        var overlay = document.createElement('div');
        overlay.id = 'omniguard-faceid-modal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0, 0, 0, 0.75)';
        overlay.style.backdropFilter = 'blur(6px)';
        overlay.style.zIndex = '9999999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        container.appendChild(iframe);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        this.overlayElement = overlay;
      } else {
        container.style.position = 'fixed';
        container.style.zIndex = '999999';
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
      }

      this.iframeElement = iframe;
      this.containerElement = container;

      window.addEventListener('message', this.handleIframeMessage.bind(this), false);
    },

    handleIframeMessage: function (event) {
      if (!event.data) return;

      if (event.data.type === 'OMNIGUARD_FACE_CAPTURED' || event.data.type === 'OMNIGUARD_FACE_VERIFIED') {
        console.log('[OmniGuard FaceID SDK] Face identity captured/verified:', event.data);
        if (typeof this.config.onCaptured === 'function') {
          this.config.onCaptured(event.data);
        }
        if (typeof this.config.onVerified === 'function') {
          this.config.onVerified(event.data);
        }
      } else if (event.data.type === 'OMNIGUARD_WIDGET_ALERT') {
        if (typeof this.config.onFlag === 'function') {
          this.config.onFlag(event.data.payload);
        }
      }
    },

    destroy: function () {
      if (this.overlayElement && this.overlayElement.parentNode) {
        this.overlayElement.parentNode.removeChild(this.overlayElement);
      } else if (this.containerElement && this.containerElement.parentNode) {
        this.containerElement.parentNode.removeChild(this.containerElement);
      }
      this.iframeElement = null;
      this.containerElement = null;
      this.overlayElement = null;
      console.log('[OmniGuard FaceID SDK] Widget destroyed.');
    }
  };

  window.OmniGuardFaceId = OmniGuardFaceId;
})(window, document);
