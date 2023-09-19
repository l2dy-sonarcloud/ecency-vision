import { UserAvatar } from "../../user-avatar";
import { FullAccount } from "../../../store/accounts/types";
import React from "react";
import { useMappedStore } from "../../../store/use-mapped-store";
import { Dropdown } from "react-bootstrap";
import { brightnessSvg } from "../../../img/svg";
import { Theme } from "../../../store/global/types";
import { _t } from "../../../i18n";
import { Link } from "react-router-dom";
import { Button } from "@ui/button";

interface Props {
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
  items: {
    label: string;
    onClick: () => void;
  }[];
}

export const DeckToolbarUser = ({ isExpanded, items, setIsExpanded }: Props) => {
  const { activeUser, global, toggleTheme, toggleUIProp } = useMappedStore();

  const getThemeSwitcher = () => (
    <div
      className={"switch-theme " + (global.theme === Theme.night ? "switched" : "")}
      onClick={() => toggleTheme()}
    >
      {brightnessSvg}
    </div>
  );

  return (
    <div
      className={
        "user flex items-center " + (isExpanded ? "justify-content-start" : "justify-center")
      }
    >
      {activeUser ? (
        <Dropdown onClick={() => setIsExpanded(true)}>
          <Dropdown.Toggle variant="link">
            <UserAvatar size="medium" global={global} username={activeUser?.username} />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {items.map(({ label, onClick }) => (
              <Dropdown.Item onClick={() => onClick()} key={label}>
                {label}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <Link to="/">
          <img
            className="user-avatar medium"
            src={
              global.isElectron ? "./img/logo-circle.svg" : require("../../../img/logo-circle.svg")
            }
          />
        </Link>
      )}
      {isExpanded ? (
        activeUser ? (
          <>
            <div className="content">
              <div className="name">{(activeUser.data as FullAccount).name}</div>
              <div className="username">@{activeUser.username}</div>
            </div>
            {getThemeSwitcher()}
          </>
        ) : (
          <>
            <Button className="w-full" outline={true} onClick={() => toggleUIProp("login")}>
              {_t("g.login")}
            </Button>
            {getThemeSwitcher()}
          </>
        )
      ) : (
        <></>
      )}
    </div>
  );
};
