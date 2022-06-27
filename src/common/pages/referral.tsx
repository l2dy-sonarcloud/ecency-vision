import React from "react";

import {connect} from "react-redux";

import {pathToRegexp} from "path-to-regexp";

import BaseComponent from "../components/base";
import Meta from "../components/meta";
import Feedback from "../components/feedback";
import ScrollToTop from "../components/scroll-to-top";
import Theme from "../components/theme";
import NavBar from "../components/navbar";
import NavBarElectron from "../../desktop/app/components/navbar";
import LinearProgress from "../components/linear-progress";
import ProfileLink from "../components/profile-link";
import UserAvatar from "../components/user-avatar";
import EntryLink, {PartialEntry} from "../components/entry-link";
import WitnessVoteBtn from "../components/witness-vote-btn";
import WitnessesExtra from "../components/witnesses-extra"
import WitnessesProxy from "../components/witnesses-proxy"
import WitnessesActiveProxy from "../components/witnesses-active-proxy";

import routes from "../../common/routes";

import {getAccount, getAccounts, getWitnessesByVote, Witness} from "../api/hive";

import {_t} from "../i18n";
import {Tsx} from "../i18n/helper";

import {linkSvg, openInNewSvg} from "../img/svg";

import {pageMapDispatchToProps, pageMapStateToProps, PageProps} from "./common";
import {FullAccount} from "../store/accounts/types";
import { WitnessCard } from "../components/witness-card";
import { dateToRelative } from '../helper/parse-date';

interface WitnessTransformed {
    rank: number;
    name: string;
    miss: number;
    fee: string;
    feed: string;
    blockSize: number;
    acAvail: number;
    acBudget: number;
    version: string;
    url: string;
    parsedUrl?: PartialEntry;
    signingKey?:string
    priceAge:string
    witnessBy?:string
}

const transform = (list: Witness[]): WitnessTransformed[] => {
    return list.map((x, i) => {
        const rank = i + 1;

        const {props} = x;

        const {total_missed: miss, url} = x;
        const fee = props.account_creation_fee;
        const feed = x.hbd_exchange_rate.base;
        const {maximum_block_size: blockSize} = props;
        const {available_witness_account_subsidies: acAvail} = x;
        const {account_subsidy_budget: acBudget} = props;
        const {running_version: version} = x;
        const {signing_key:signingKey} = x
        const {last_hbd_exchange_update:priceAge} = x;

        let parsedUrl;
        const oUrl = new URL(url, 'https://ecency.com');
        const ex = pathToRegexp(routes.ENTRY).exec(oUrl.pathname);

        if (ex) {
            parsedUrl = {
                category: ex[1],
                author: ex[2].replace("@", ""),
                permlink: ex[3]
            }
        }

        return {
            rank,
            name: x.owner,
            miss,
            fee,
            feed,
            blockSize,
            acAvail: Math.round(acAvail / 10000),
            acBudget,
            version,
            url,
            parsedUrl,
            signingKey,
            priceAge,
        };
    });
}

interface State {
    witnesses: WitnessTransformed[];
    witnessVotes: string[];
    proxy: string | null;
    loading: boolean;
}

class WitnessesPage extends BaseComponent<PageProps, State> {
    state: State = {
        witnesses: [],
        witnessVotes: [],
        proxy: null,
        loading: true
    }

    componentDidMount() {
        this.load();
    }

    componentDidUpdate(prevProps: Readonly<PageProps>, prevState: Readonly<State>, snapshot?: any) {
        // active user changed
        if (this.props.activeUser?.username !== prevProps.activeUser?.username) {
            this.stateSet({loading: true}, () => {
                this.load();
            })
        }
    }

    load = async () => {
        this.stateSet({loading: true});

        const {activeUser} = this.props;
        if (activeUser) {
            const resp = await getAccount(activeUser.username);
            const {witness_votes: witnessVotes, proxy} = resp;
            this.stateSet({witnessVotes: witnessVotes || [], proxy: proxy || null});
        } else {
            this.stateSet({witnessVotes: [], proxy: null});
        }

        const witnesses = await getWitnessesByVote();
        await this.getWitness(transform(witnesses));
    }

    addWitness = (name: string) => {
        const {witnessVotes} = this.state;
        const newVotes = [...witnessVotes, name]
        this.stateSet({witnessVotes: newVotes});
    }

    deleteWitness = (name: string) => {
        const {witnessVotes} = this.state;
        const newVotes = witnessVotes.filter(x => x !== name)
        this.stateSet({witnessVotes: newVotes});
    }

    getWitness = async (witnessArray:WitnessTransformed[])=>{
        const witnessUserNamesArray:string[] = witnessArray.map((item: WitnessTransformed)=> {
            return item.name
        })
        try {
            const accounts:FullAccount[] = await getAccounts(witnessUserNamesArray);
            const byWitnessState:WitnessTransformed[] = witnessArray.map((item: WitnessTransformed, index: number) => {
                try {
                    const parsedArray = JSON.parse(accounts[index].posting_json_metadata?accounts[index].posting_json_metadata:'');
                    return {
                        ...item,
                        witnessBy:parsedArray.profile.witness_owner ? parsedArray.profile.witness_owner: undefined
                    }
                }
                catch (e) {
                    return item
                }
            })
            this.stateSet({witnesses:byWitnessState, loading: false});
        } catch (error) {
            console.log('Something went wrong: ',error)
        }
    }

    render() {
        //  Meta config
        const metaProps = {
            title: _t("referral.page-title"),
            description: _t("referral.page-description"),
        };

        const {global, activeUser} = this.props;
        const {witnesses, loading, witnessVotes, proxy} = this.state;
        const extraWitnesses = witnessVotes.filter(w => !witnesses.find(y => y.name === w));

        const table = <><table className="table d-none d-sm-block">
            <thead>
            <tr>
                <th className="col-rank">
                    {_t("referral.list-rank")}
                </th>
                <th>
                    {_t("referral.list-referral")}
                </th>
                <th className="col-miss">
                    {_t("referral.list-miss")}
                </th>
                <th className="col-url">
                    {_t("referral.list-url")}
                </th>
                <th className="col-fee">
                    {_t("referral.list-fee")}
                </th>
                <th className="col-feed">
                    {_t("referral.list-feed")}
                </th>
                <th className="col-version">
                    {_t("referral.list-version")}
                </th>
            </tr>
            </thead>
            <tbody>
            {witnesses.map((row, i) => {
                return <tr key={row.rank}>
                    <td>
                        <div className="witness-rank">
                            <span className="rank-number">{row.rank}</span>
                            $$
                        </div>
                    </td>
                    <td>
                        {ProfileLink({
                            ...this.props,
                            username: row.name,
                            children: <span className="witness-card notranslate"> {UserAvatar({
                                ...this.props,
                                username: row.name,
                                size: "medium"
                            })}
                                <div className={'witness-ctn'}>
                                  Referral   {i + 1}
                                </div>
                            </span>
                        })}
                    </td>
                    {/* To user profile */}
                    <td>
                        {(() => {
                            const {parsedUrl} = row;

                            if (parsedUrl) {
                                return (
                                    <EntryLink {...this.props} entry={parsedUrl}>
                                        <span className="witness-link">{linkSvg}</span>
                                    </EntryLink>
                                );
                            }

                            return (
                                <a target="_external" href={row.url} className="witness-link">{openInNewSvg}</a>
                            );
                        })()}
                    </td>
                </tr>
            })}
            </tbody>
        </table>
        <div className="d-md-none">
        {/* Mobile Screen */}
        {/* {referrals.map((row, i) => {
            return <ReferralCard
                    referral={row.name}
                    row={row}
                    key={i}
                    global={global}
                    />
        })} */}
        </div>
        </>;

        const header = <div className="page-header mt-5">
            <div className="header-title">
                {_t('referral.page-title')}
            </div>
            <Tsx k="referral.page-description-long"><div className="header-description" /></Tsx>
            {activeUser && (
                <Tsx k="referral.remaining" args={{n: 30 - witnessVotes.length, max: 30}}>
                    <div className="remaining"/>
                </Tsx>
            )}
        </div>;
        let containerClasses = global.isElectron ? " mt-0 pt-6" : "";

        return (
            <>
                <Meta {...metaProps} />
                <ScrollToTop/>
                <Theme global={this.props.global}/>
                <Feedback/>
                {global.isElectron ?
                    NavBarElectron({
                        ...this.props,
                        reloadFn: this.load,
                        reloading: loading,
                    }) :
                    NavBar({...this.props})}
                <div className={"app-content witnesses-page" + containerClasses}>
                    {(() => {
                        if (loading) {
                            return <>
                                {header}
                                <LinearProgress/>
                            </>
                        }

                        return <>
                            {header}
                            <div className="table-responsive witnesses-table">{table}</div>
                        </>
                    })()}
                </div>
            </>
        );
    }
}


export default connect(pageMapStateToProps, pageMapDispatchToProps)(WitnessesPage);
