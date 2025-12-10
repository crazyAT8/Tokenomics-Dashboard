'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, X, TrendingUp, TrendingDown, Edit2, Trash2, ToggleLeft, ToggleRight, Mail, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PriceAlert, PriceAlertType, CoinData } from '@/lib/types';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useDashboardStore, Currency } from '@/lib/store';
import { formatCurrency } from '@/lib/utils/currency';
import { sanitizeUrl, escapeHtml } from '@/lib/utils/sanitize';
import { requestNotificationPermission, isNotificationSupported } from '@/lib/utils/notifications';

interface PriceAlertsProps {
  coin: CoinData | null;
}

export const PriceAlerts: React.FC<PriceAlertsProps> = ({ coin }) => {
  const currency = useDashboardStore((state) => state.currency);
  const { alerts, addAlert, removeAlert, updateAlert, toggleAlert, getAlertsForCoin } = usePriceAlerts();
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState<PriceAlertType>('above');
  const [note, setNote] = useState('');
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [coinAlerts, setCoinAlerts] = useState<PriceAlert[]>([]);
  const [emailNotification, setEmailNotification] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [browserNotification, setBrowserNotification] = useState(false);
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default');

  useEffect(() => {
    if (coin) {
      const alertsForCoin = getAlertsForCoin(coin.id);
      setCoinAlerts(alertsForCoin);
    } else {
      setCoinAlerts([]);
    }
  }, [coin, alerts, getAlertsForCoin]);

  // Check browser notification permission on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      setBrowserNotificationPermission(Notification.permission);
    }
  }, []);

  // Request browser notification permission when user enables it
  const handleBrowserNotificationToggle = async (enabled: boolean) => {
    if (enabled && isNotificationSupported()) {
      try {
        const permission = await requestNotificationPermission();
        setBrowserNotificationPermission(permission);
        if (permission === 'granted') {
          setBrowserNotification(true);
        } else {
          setBrowserNotification(false);
          alert('Browser notification permission was denied. Please enable it in your browser settings.');
        }
      } catch (error: any) {
        console.error('Failed to request notification permission:', error);
        alert(error.message || 'Failed to enable browser notifications');
        setBrowserNotification(false);
      }
    } else {
      setBrowserNotification(false);
    }
  };

  const handleAddAlert = () => {
    if (!coin || !targetPrice) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price target');
      return;
    }

    if (coin.current_price && alertType === 'above' && price <= coin.current_price) {
      alert(`Price target must be above current price (${formatCurrency(coin.current_price, currency)})`);
      return;
    }

    if (coin.current_price && alertType === 'below' && price >= coin.current_price) {
      alert(`Price target must be below current price (${formatCurrency(coin.current_price, currency)})`);
      return;
    }

    // Validate email if email notification is enabled
    if (emailNotification && (!emailAddress || !emailAddress.includes('@'))) {
      alert('Please enter a valid email address for email notifications');
      return;
    }

    addAlert(
      coin,
      price,
      alertType,
      currency,
      note || undefined,
      emailNotification,
      emailNotification ? emailAddress : undefined,
      browserNotification
    );
    setTargetPrice('');
    setNote('');
    setAlertType('above');
    setEmailNotification(false);
    setEmailAddress('');
    setBrowserNotification(false);
    setIsAddingAlert(false);
  };

  const handleEditAlert = (alert: PriceAlert) => {
    setEditingAlertId(alert.id);
    setTargetPrice(alert.targetPrice.toString());
    setAlertType(alert.type);
    setNote(alert.note || '');
    setEmailNotification(alert.emailNotification || false);
    setEmailAddress(alert.emailAddress || '');
    setBrowserNotification(alert.browserNotification || false);
    setIsAddingAlert(true);
  };

  const handleUpdateAlert = () => {
    if (!coin || !targetPrice || !editingAlertId) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price target');
      return;
    }

    if (coin.current_price && alertType === 'above' && price <= coin.current_price) {
      alert(`Price target must be above current price (${formatCurrency(coin.current_price, currency)})`);
      return;
    }

    if (coin.current_price && alertType === 'below' && price >= coin.current_price) {
      alert(`Price target must be below current price (${formatCurrency(coin.current_price, currency)})`);
      return;
    }

    // Validate email if email notification is enabled
    if (emailNotification && (!emailAddress || !emailAddress.includes('@'))) {
      alert('Please enter a valid email address for email notifications');
      return;
    }

    updateAlert(editingAlertId, {
      targetPrice: price,
      type: alertType,
      note: note || undefined,
      emailNotification,
      emailAddress: emailNotification ? emailAddress : undefined,
      browserNotification,
    });

    setTargetPrice('');
    setNote('');
    setAlertType('above');
    setEmailNotification(false);
    setEmailAddress('');
    setBrowserNotification(false);
    setIsAddingAlert(false);
    setEditingAlertId(null);
  };

  const handleCancel = () => {
    setTargetPrice('');
    setNote('');
    setAlertType('above');
    setEmailNotification(false);
    setEmailAddress('');
    setBrowserNotification(false);
    setIsAddingAlert(false);
    setEditingAlertId(null);
  };

  const getPriceDifference = (alert: PriceAlert, currentPrice: number) => {
    const difference = alert.type === 'above' 
      ? alert.targetPrice - currentPrice 
      : currentPrice - alert.targetPrice;
    const percentage = (difference / currentPrice) * 100;
    return { difference, percentage };
  };

  if (!coin) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 sm:p-4 md:p-5 lg:p-6 pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary-600" />
            Price Alerts
          </CardTitle>
          {!isAddingAlert && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingAlert(true)}
              className="text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Add Alert
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6 pt-2 sm:pt-3">
        {isAddingAlert ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={sanitizeUrl(coin.image)}
                alt={escapeHtml(coin.name)}
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
              />
              <div>
                <div className="text-sm sm:text-base font-semibold text-gray-900">
                  {escapeHtml(coin.name)}
                </div>
                <div className="text-xs text-gray-500">
                  Current: {formatCurrency(coin.current_price, currency)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Alert Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAlertType('above')}
                  className={`flex-1 px-3 py-2 rounded-md border transition-all text-xs sm:text-sm font-medium ${
                    alertType === 'above'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Above
                </button>
                <button
                  onClick={() => setAlertType('below')}
                  className={`flex-1 px-3 py-2 rounded-md border transition-all text-xs sm:text-sm font-medium ${
                    alertType === 'below'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Below
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Target Price ({currency.toUpperCase()})
              </label>
              <Input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={`Enter target price`}
                className="w-full"
              />
              {coin.current_price && targetPrice && !isNaN(parseFloat(targetPrice)) && (
                <p className="text-xs text-gray-500 mt-1">
                  {alertType === 'above' 
                    ? `Alert when price goes above ${formatCurrency(parseFloat(targetPrice), currency)}`
                    : `Alert when price goes below ${formatCurrency(parseFloat(targetPrice), currency)}`
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Note (optional)
              </label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full"
              />
            </div>

            {/* Notification Settings */}
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Notification Settings
              </label>

              {/* Browser Notification */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-gray-600" />
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                      Browser Notification
                    </label>
                    {!isNotificationSupported() && (
                      <p className="text-xs text-gray-500">Not supported in this browser</p>
                    )}
                    {isNotificationSupported() && browserNotificationPermission === 'denied' && (
                      <p className="text-xs text-red-500">Permission denied. Enable in browser settings.</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBrowserNotificationToggle(!browserNotification)}
                  disabled={!isNotificationSupported() || browserNotificationPermission === 'denied'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    browserNotification ? 'bg-primary-600' : 'bg-gray-300'
                  } ${(!isNotificationSupported() || browserNotificationPermission === 'denied') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      browserNotification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Email Notification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <label className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">
                      Email Notification
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailNotification(!emailNotification);
                      if (emailNotification) {
                        setEmailAddress('');
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailNotification ? 'bg-primary-600' : 'bg-gray-300'
                    } cursor-pointer`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailNotification ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {emailNotification && (
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full text-xs sm:text-sm"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={editingAlertId ? handleUpdateAlert : handleAddAlert}
                className="flex-1"
              >
                {editingAlertId ? 'Update Alert' : 'Create Alert'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {coinAlerts.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Bell className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-1">No price alerts set</p>
                <p className="text-xs text-gray-400">Get notified when the price reaches your target</p>
              </div>
            ) : (
              coinAlerts.map((alert) => {
                const priceDiff = getPriceDifference(alert, coin.current_price);
                const isTriggered = !!alert.triggeredAt;

                return (
                  <div
                    key={alert.id}
                    className={`p-3 sm:p-4 rounded-lg border ${
                      isTriggered
                        ? 'bg-gray-50 border-gray-300 opacity-60'
                        : alert.isActive
                        ? 'bg-white border-gray-200 hover:border-primary-300'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={sanitizeUrl(alert.coinImage)}
                          alt={escapeHtml(alert.coinName)}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                            {escapeHtml(alert.coinName)}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {alert.type === 'above' ? (
                              <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                            )}
                            <span className="text-xs text-gray-600">
                              {alert.type === 'above' ? 'Above' : 'Below'}{' '}
                              {formatCurrency(alert.targetPrice, alert.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className="ml-2 flex-shrink-0"
                        disabled={isTriggered}
                        aria-label={alert.isActive ? 'Disable alert' : 'Enable alert'}
                      >
                        {alert.isActive ? (
                          <ToggleRight className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                        )}
                      </button>
                    </div>

                    {!isTriggered && (
                      <div className="text-xs text-gray-500 mb-2">
                        {priceDiff.difference >= 0 ? (
                          <span>
                            {priceDiff.percentage.toFixed(2)}% away from target
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">
                            Target reached! ({formatCurrency(Math.abs(priceDiff.difference), currency)})
                          </span>
                        )}
                      </div>
                    )}

                    {alert.note && (
                      <div className="text-xs text-gray-600 mb-2 italic">
                        "{escapeHtml(alert.note)}"
                      </div>
                    )}

                    {/* Notification indicators */}
                    {(alert.browserNotification || alert.emailNotification) && (
                      <div className="flex items-center gap-3 mb-2">
                        {alert.browserNotification && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Smartphone className="h-3 w-3 text-primary-600" />
                            <span>Browser</span>
                          </div>
                        )}
                        {alert.emailNotification && alert.emailAddress && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="h-3 w-3 text-primary-600" />
                            <span>Email</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isTriggered && (
                      <div className="text-xs text-red-600 font-medium mb-2">
                        Triggered on {new Date(alert.triggeredAt!).toLocaleString()}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-400">
                        Created {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        {!isTriggered && (
                          <>
                            <button
                              onClick={() => handleEditAlert(alert)}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              aria-label="Edit alert"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this alert?')) {
                                  removeAlert(alert.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 rounded transition-colors"
                              aria-label="Delete alert"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

