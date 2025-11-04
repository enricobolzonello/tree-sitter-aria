/**
 * @file Tree Sitter parser for the Aria lang
 * @author Borja Castellano <borjacastellano1@gmail.com>
 * @license MIT
 */

function list_of(separator, rule) {
  return seq(rule, repeat(seq(separator, rule)));
}

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "aria",

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.function_definition,
          $._statement,
          $.struct_definition,
          $.extension_definition,
          $.import,
        ),
      ),

    import: ($) =>
      seq(
        "import",
        optional(seq($.identifier, "from")),
        repeat(seq($.identifier, optional("."))),
        ";",
      ),

    struct_definition: ($) => seq("struct", $.identifier, $.struct_block),

    extension_definition: ($) => seq("extension", $.identifier, $.struct_block),

    struct_block: ($) =>
      seq(
        "{",
        repeat(
          choice(
            $.function_definition,
            $.type_function_definition,
            $.operator_override,
          ),
        ),
        "}",
      ),

    function_definition: ($) =>
      seq(
        "func",
        $.identifier,
        $.parameter_list,
        optional(field("return_type", $.identifier)),
        $.logic_block,
      ),

    type_function_definition: ($) =>
      seq(
        "type",
        "func",
        $.identifier,
        $.parameter_list,
        optional(field("return_type", $.identifier)),
        $.logic_block,
      ),

    operator_override: ($) =>
      seq(
        optional("reverse"),
        "operator",
        $.operador_overridble,
        choice("(rhs)", "(lhs)"),
        optional(field("return_type", $.identifier)),
        $.logic_block,
      ),

    // TODO: Removed (), [], []=
    // TODO: Differenciate between operator overridable and regular operators
    operador_overridble: ($) =>
      choice(
        "+",
        "-",
        "*",
        "/",
        "%",
        "<<",
        ">>",
        "==",
        "!=",
        "<",
        ">",
        "<=",
        ">=",
        "&",
        "|",
        "^",
        "u-",
      ),

    operator: ($) =>
      choice(
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
        "<<=",
        ">>=",
        "&=",
        "|=",
        "^=",
        $.operador_overridble,
      ),

    parameter_list: ($) => seq("(", optional($.parameter), ")"),

    parameter: ($) =>
      choice("...", seq($.identifier, optional(seq(":", $.identifier)))),

    logic_block: ($) => seq("{", repeat($._statement), "}"),

    _statement: ($) =>
      choice(
        $.return_statement,
        $.expression_statement,
        $.variable_declaration,
        $.assignment_statement,
        $.control_flow_statement,
        $.assert_statement,
      ),

    return_statement: ($) => seq("return", $.expression, ";"),

    expression_statement: ($) => seq($.expression, ";"),

    variable_declaration: ($) =>
      seq("val", $.identifier, optional(seq("=", $.expression)), ";"),

    assignment_statement: ($) => seq($.identifier, "=", $.expression, ";"),

    assert_statement: ($) => seq("assert", $.expression, ";"),

    control_flow_statement: ($) =>
      choice($.if_statement, $.while_statement, $.for_statement),

    if_statement: ($) =>
      seq(
        "if",
        $.expression,
        $.logic_block,
        optional(seq("else", $.logic_block)),
      ),

    while_statement: ($) => seq("while", $.expression, $.logic_block),

    for_statement: ($) =>
      seq("for", $.identifier, "in", $.expression, $.logic_block),

    expression: ($) =>
      seq(
        choice(
          $.alloc_call,
          $.method_call,
          $.object_field,
          $.function_call,
          $.number,
          $.string,
          $.array,
          $.identifier,
        ),
        optional(seq($.operator, $.expression)),
      ),

    identifier: ($) => /[a-zA-Z_\-][a-zA-Z_\-0-9]*/,

    number: ($) => /\d+/,

    string: ($) => /"[^"]*"/,

    array: ($) => seq("[", optional(list_of(",", $.expression)), "]"),

    object_field: ($) => seq($.identifier, ".", $.identifier),

    alloc_call: ($) =>
      prec.right(99, seq("alloc(", $.identifier, ")", optional($.alloc_block))),

    alloc_block: ($) =>
      seq(
        "{",
        list_of(",", seq(".", $.identifier, "=", $.expression)),
        optional(","),
        "}",
      ),

    method_call: ($) => seq($.identifier, ".", $.function_call),

    function_call: ($) => seq($.identifier, $.argument_list),

    argument_list: ($) => seq("(", optional(list_of(",", $.expression)), ")"),

    comment: ($) => /#[^\n]*\n/,
  },
});
