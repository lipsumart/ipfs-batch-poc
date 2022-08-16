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
import InputGroup from "react-bootstrap/InputGroup";
import Modal from "react-bootstrap/Modal";

import useSWR from "swr";

import { request } from "graphql-request";

import { validateAddress } from "@taquito/utils";

export default function Home() {
  const [batch, setBatch] = useState([]);
  const [target, setTarget] = useState("");
  const [batchCount, setBatchCount] = useState(0);
  const [cartModalStatus, setCartModalStatus] = useState(false);

  const handleItemCount = () => {
    let count = 0;

    for (let i = 0; i < batch.length; i++)
      count += batch[i][1];

    setBatchCount(count);
  }

  const onCartClick = () => {
    setCartModalStatus(true);
  }

  const onHideModal = () => {
    setCartModalStatus(false);
  }

  const onSubmit = (e) => {
    console.log(e);
    setTarget(e.target[0].value);
    e.preventDefault();
  };

  const onChange = (el, quantity) => {
    let batchCopy = batch;
    let found = false;
    let foundIndex;

    for (var i = 0; i < batchCopy.length; i++)
      if (batchCopy[i][0] === el)
      {
        found = true;
        foundIndex = i;
      }       

    if (!found && quantity > 0) batchCopy.push([el, quantity]);
    else if (found && quantity > 0) batchCopy[foundIndex][1] = quantity;
    else if (found && quantity === 0)
      if (foundIndex === 0) batchCopy.shift()
      else if (foundIndex === batchCopy.length -1) batchCopy.pop()
      else batchCopy.splice(foundIndex, 1)
    
    setBatch(batchCopy);
    handleItemCount();
    console.log(batch);
    console.log(batchCount);
  };

  return (
    <Container>
      <TopBar onSubmit={onSubmit} cartTotal={batchCount} onCartClick={onCartClick}/>
      <CartModal show={cartModalStatus} onHideModal={onHideModal}/>
      <DataMap target={target} onChange={onChange}/>
    </Container>
  )
}

export function DataMap(props){
  const fetcher = query => request("https://data.objkt.com/v2/graphql", query);
  const { data, error } = useSWR(
  `{
    listing(where: {token: {creators: {creator_address: {_eq: ` + props.target + `}}, supply: {_gt: "0"}}, status: {_eq: "active"}}, order_by: {token: {timestamp: asc}, price: asc}) {
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

  const onChange = (el, quantity) => {
    console.dir(el);
    props.onChange(el, quantity);
  };

  if (props.target === "") return <div>No target.</div>;
  if (props.target !== "" && validateAddress(props.target) !== 3) return <div>Invalid address.</div>;
  if (error) {
    console.log(error);
    return <div>Failed to Load</div>;
  }
  if (!data) return <div>Loading...</div>;
  if (!error && data){

    return <Row>
    {data["listing"]
    .map((el, i , arr) => {
      return (
      <Col key={i} id={i} xs={4} sm={4} md={3} lg={2}>
          <StateImg src={"https://ipfs.io/ipfs/" + el["token"]["display_uri"].slice(7,)}/>
          <h5>{el["token"]["name"]}</h5>
          <p>{el["price"] / 1000000}</p>
          <Row>
            <QuantityForm remaining={el["amount_left"]} onChange={onChange} element={el}/>
          </Row>
      </Col>)      
    })}
    </Row>
  }
}

export function QuantityForm(props){
  const [quantity, setQuantity] = useState(0);

  useEffect(()=>{
    props.onChange(props.element, quantity) 
  }, [props, quantity]);

  const onChange = (e) => {
    setQuantity(parseInt(e.target.value));  
    e.preventDefault();   
  };

  return (
    <Form.Group>
      <Form.Label>Quantity</Form.Label>
      <InputGroup>
        <Form.Control onChange={onChange} onKeyDown={(e)=>{e.preventDefault();}} type={"number"} value={quantity} min={0} max={props.remaining} aria-describedby="basic-addon1"/>
          <InputGroup.Text id="basic-addon1">
            {"/" + props.remaining}
          </InputGroup.Text>
      </InputGroup>
    </Form.Group>
  );
}

export function TopBar(props){

  return (          
  <Navbar bg="light" expand="lg" sticky={"top"} fixed={"top"}>
    <Navbar.Brand href="#home">Tezos Batch Collector v0.1</Navbar.Brand>
    <Navbar.Toggle aria-controls="basic-navbar-nav" />
    <Navbar.Collapse id="basic-navbar-nav">
      <Nav className="me-auto">
        <Form onSubmit={props.onSubmit}>
          <Form.Group>
            <Form.Label>
              Target Tezos Address:
              <Form.Control type={"text"} placeholder={"Enter Tez Address of creator"}/>
            </Form.Label>
          </Form.Group>
          <Button type={"submit"}>Submit</Button>
        </Form>      
      </Nav>
      <Button onClick={props.onCartClick}>{"Cart: " + props.cartTotal}</Button>  
    </Navbar.Collapse>                  
  </Navbar>);
}

export function CartModal(props){
  return (
  <Modal show={props.show} onHide={props.onHideModal}>
    <Modal.Header closeButton>
      <Modal.Title>Cart</Modal.Title>
    </Modal.Header>
    <Modal.Body>Woohoo, you're reading this text in a modal!
          
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={props.onHideModal}>
        Close
      </Button>
      <Button variant="primary" onClick={props.onHideModal}>
        Save Changes
      </Button>
    </Modal.Footer>
  </Modal>);
}

export function StateImg(props){
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("100%");
  return <Image height={height} width={width} alt=""
    src={props.src}
    onLoadingComplete={(obj)=>{
      setWidth(obj.naturalWidth);
      setHeight(obj.naturalHeight);
    }
  }></Image>
}