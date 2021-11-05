import React from 'react';
import { MarketStatistics } from '../../api/hive';
import { _t } from '../../i18n';
import { Skeleton } from '../skeleton';

interface Props {
    loading: boolean;
    data: MarketStatistics | null;
}
export const ChartStats = ({loading, data}: Props) =>{

    return loading ? <div className="d-flex justify-content-center w-100">
                        <Skeleton className="skeleton-loading mr-5" />
                        <Skeleton className="skeleton-loading mr-5" />
                        <Skeleton className="skeleton-loading mr-5" />
                        <Skeleton className="skeleton-loading mr-5" />
                        <Skeleton className="skeleton-loading" />
                    </div> : <div className="d-flex flex-wrap justify-content-center">
                                <small className="d-inline-flex border mr-5">
                                    <div className="p-2 font-weight-bold border-right">{_t("market.last-price")}</div>
                                    <div className="p-2">${data ? parseFloat(data!.latest!).toFixed(6) : null} (<span className="text-success">+0.00%</span>)</div>
                                </small>


                                <small className="d-inline-flex border">
                                    <div className="p-2 font-weight-bold border-right">{_t("market.volume")}</div>
                                    <div className="p-2">${data? parseFloat(data!.hbd_volume)!.toFixed(2):null}</div>
                                </small>


                                <small className="d-inline-flex border mx-5">
                                    <div className="p-2 font-weight-bold border-right">{_t("market.bid")}</div>
                                    <div className="p-2">${data? parseFloat(data!.highest_bid)!.toFixed(6):null}</div>
                                </small>


                                <small className="d-inline-flex border">
                                    <div className="p-2 font-weight-bold border-right">{_t("market.last-price")}</div>
                                    <div className="p-2">${data? parseFloat(data!.lowest_ask)!.toFixed(6):null}</div>
                                </small>


                                <small className="d-inline-flex border ml-5">
                                    <div className="p-2 font-weight-bold border-right" >{_t("market.spread")}</div>
                                    <div className="p-2">{data? ((200 * (parseFloat(data.lowest_ask) - parseFloat(data.highest_bid))) / (parseFloat(data.highest_bid) + parseFloat(data.lowest_ask))).toFixed(3) : null}%</div>
                                </small>
                            </div>
} 