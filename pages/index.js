/* eslint-disable react-hooks/exhaustive-deps */
import Image from "next/image";

import { useState, useEffect } from "react";

import "bootstrap/dist/css/bootstrap.min.css";

import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Modal from "react-bootstrap/Modal";
import CloseButton from "react-bootstrap/CloseButton";

import useSWR from "swr";

import { request } from "graphql-request";

import { validateAddress } from "@taquito/utils";

export default function Home(){
  const [batch, setBatch] = useState([]); // [{index, count}]
  const [target, setTarget] = useState("");
  const [cart, setCart] = useState([]);
  const [cartModalStatus, setCartModalStatus] = useState(false);
  const fetcher = query => request("https://data.objkt.com/v2/graphql", query);
  const { data, error } = useSWR(
  `{
    listing(where: {token: {creators: {creator_address: {_eq: ` + target + `}}, supply: {_gt: "0"}}, status: {_eq: "active"}}, order_by: {token: {timestamp: asc}, price: asc}) {
      token {
        name
        display_uri
        timestamp
        supply
      }
      price
      seller {
        address
        alias
      }
      amount_left
    }
  }`, fetcher);

  const onCartClick = () => {
    setCartModalStatus(true);
  }

  const onHideModal = () => {
    setCartModalStatus(false);
  }

  useEffect(()=>{
    setBatch(cart.filter((b) => target === b.tgt));

  }, [target]);

  const onSubmit = (e) => {
    console.log(e);
    setTarget(e.target[0].value);
    
    e.preventDefault();
  };

  const batchCount = batch.reduce((sum, item) => sum + item.count, 0);

  const onChange = (index, count, token, tgt) => {
    if (count === 0) {
      setBatch(batch.filter((b) => b.index !== index)); // remove from batch
      setCart(cart.filter((b) => b.token !== token)); // remove from cart if same element
    } else {
      const found = batch.find((b) => b.index === index);
      if (found) {
        setBatch(batch.map((b) => (b.index === index ? { index, count, token, tgt } : b)));
        setCart(cart.map((b) => (b.token === token ? { index, count, token, tgt }: b)));
      } else {
        setBatch([...batch, { index, count, token, tgt }]);
        setCart([...cart, { index, count, token, tgt }])
      }
    }
  };

  return (
    <Container>
      <TopBar cartTotal={batchCount} onSubmit={onSubmit} onCartClick={onCartClick}/>
      <DataMap data={data} batch={batch} onChange={onChange} target={target} error={error}/>
      <CartModal data={data} batch={batch} onChange={onChange} show={cartModalStatus} onHideModal={onHideModal} cart={cart}/>
    </Container>
  );
};

export const DataMap = ({ data, batch, onChange, target, error }) => {
  if (target === "") return <div>No target.</div>;
  if (target !== "" && validateAddress(target) !== 3) return <div>Invalid address.</div>;
  if (error) {
    console.log(error);
    return <div>Failed to Load</div>;
  }
  if (!data) return <div>Loading...</div>;
  if (!error && data){
    return (
      <Row>
        {data.listing.map(({ token: { name, display_uri }, price, amount_left }, index, arr) => (
          <Col key={index} id={index} xs={4} sm={4} md={3} lg={2}>
            {display_uri ? <StateImg src={"https://ipfs.io/ipfs/" + display_uri.slice(7,)}/>: null}
            <h5>name: {name}</h5>
            <p>price: {price / 1000000}</p>
            <Row>
              <QuantityForm
              value={batch.find((b) => b.index === index)?.count || 0}
              maxValue={amount_left}
              onChange={(v) => onChange(index, v, arr[index], target)}
            />
            </Row>
          </Col>
        ))}
      </Row>
    );
  }
};

export const QuantityForm = ({ value, maxValue, onChange }) => {
  return (
    <div style={{ display: "flex" }}>
      {value} / {maxValue}
      <button onClick={(e) => onChange(Math.min(value + 1, maxValue))}>
        +
      </button>
      <button onClick={(e) => onChange(Math.max(value - 1, 0))}>-</button>
    </div>
  );
};

export const CartModal = ({ data, batch, onChange, show, onHideModal, cart })=>{
  return (
  <Modal show={show} onHide={onHideModal}>
    <Container>
      <Modal.Header closeButton>
        <Modal.Title>Cart</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
        {
          cart.map(({ index, count, token, target }) => (
            <Col key={index}>              
              <CloseButton onClick={(e) => onChange(index, 0, token, target)}/>
              <h5>{token.name}</h5>
              <p>{token.price / 1000000} {" xtz"}</p>
              <p>{count}</p>
            </Col>
          ))
        }
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHideModal}>
          Close
        </Button>
        <Button variant="primary" onClick={onHideModal}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Container>
  </Modal>);
}

export const StateImg = ({ src })=>{
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("100%");
  return <Image height={height} width={width} alt=""
    src={src}
    onLoadingComplete={(obj)=>{
      setWidth(obj.naturalWidth);
      setHeight(obj.naturalHeight);
    }
  }></Image>
}

export const TopBar = ({ cartTotal, onSubmit, onCartClick })=>{
  return (          
  <Navbar bg="light" expand="lg" sticky={"top"} fixed={"top"}>
    <Navbar.Brand href="#home">Tezos Batch Collector v0.1</Navbar.Brand>
    <Navbar.Toggle aria-controls="basic-navbar-nav" />
    <Navbar.Collapse id="basic-navbar-nav">
      <Nav className="me-auto">
        <Form onSubmit={onSubmit}>
          <Form.Group>
            <Form.Label>
              Target Tezos Address:
              <Form.Control type={"text"} placeholder={"Enter Tez Address of creator"}/>
            </Form.Label>
          </Form.Group>
          <Button type={"submit"}>Submit</Button>
        </Form>      
      </Nav>
      <Button onClick={onCartClick}>{"Cart: " + cartTotal}</Button>  
    </Navbar.Collapse>                  
  </Navbar>);
}