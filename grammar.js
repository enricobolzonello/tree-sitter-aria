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
  
  conflicts: $ => [
    [$.operator, $.type],
  ],

  conflicts: ($) => [[$.primary_expression, $.type]],

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.function_definition,
          $._statement,
          $.struct_definition,
          $.extension_definition,
          $.enum_definition,
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

    enum_definition: ($) => seq("enum", $.identifier, $.enum_block),

    enum_block: ($) =>
      seq(
        "{",
        repeat(choice($.struct_definition)),
        list_of(",", $.enum_case),
        "}",
      ),

    enum_case: ($) =>
      seq("case", $.identifier, optional(seq("(", list_of(",", $.type), ")"))),

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
        optional(field("return_type", $.type)),
        $.logic_block,
      ),

    type_function_definition: ($) =>
      seq(
        "type",
        "func",
        $.identifier,
        $.parameter_list,
        optional(field("return_type", $.type)),
        $.logic_block,
      ),

    operator_override: ($) =>
      seq(
        optional("reverse"),
        "operator",
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
        choice("(rhs)", "(lhs)"),
        optional(field("return_type", $.identifier)),
        $.logic_block,
      ),

    assignment_operator: ($) =>
      choice("+=", "-=", "*=", "/=", "%=", "<<=", ">>=", "&=", "|=", "^=", "="),

    parameter_list: ($) => seq("(", optional($.parameter), ")"),

    parameter: ($) =>
      choice("...", seq($.identifier, optional(seq(":", $.type)))),

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

    return_statement: ($) => seq("return", optional($.expression), ";"),

    expression_statement: ($) => seq($.expression, ";"),

    variable_declaration: ($) =>
      seq(
        "val",
        $.identifier,
        optional(seq($.assignment_operator, $.expression)),
        ";",
      ),

    assignment_statement: ($) =>
      seq($.identifier, $.assignment_operator, $.expression, ";"),

    assert_statement: ($) => seq("assert", $.expression, ";"),

    control_flow_statement: ($) =>
      choice(
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.match_statement,
      ),

    if_statement: ($) =>
      seq(
        "if",
        $.expression,
        $.logic_block,
        repeat($.elsif_clause),
        optional($.else_clause),
      ),

    while_statement: ($) =>
      seq("while", $.expression, $.logic_block, optional($.else_clause)),

    for_statement: ($) =>
      seq(
        "for",
        $.identifier,
        "in",
        $.expression,
        $.logic_block,
        optional($.else_clause),
      ),

    match_statement: ($) => seq("match", $.identifier, $.match_block),

    match_block: ($) => seq("{", list_of(",", $.match_arm), "}"),

    match_arm: ($) => seq("case", $.pattern, "=>", $.logic_block),

    elsif_clause: ($) => seq("elsif", $.expression, $.logic_block),

    else_clause: ($) => seq("else", $.logic_block),

    expression: ($) =>
      choice($.binary_expression, $.unary_expression, $.primary_expression),

    binary_expression: ($) =>
      prec.left(10, seq($.expression, $.binary_operator, $.expression)),

    unary_expression: ($) =>
      prec.right(20, seq($.prefix_operator, $.expression)),

    primary_expression: ($) =>
      choice(
        $.literal,
        $.alloc_call,
        $.function_call,
        $.enum_value,
        $.identifier,
        seq("(", $.expression, ")"),
        seq($.prefix_operator, $.expression),
        seq($.expression, $.suffix_operator),
      ),

    literal: ($) => choice($.number, $.string, $.array),

    binary_operator: ($) =>
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
        ".",
      ),

    suffix_operator: ($) => choice("!!"),

    prefix_operator: ($) => choice("-"),

    alloc_call: ($) =>
      prec.right(99, seq("alloc(", $.identifier, ")", optional($.alloc_block))),

    alloc_block: ($) =>
      seq(
        "{",
        list_of(",", seq(".", $.identifier, "=", $.expression)),
        optional(","),
        "}",
      ),

    enum_value: ($) =>
      seq(
        $.type,
        "::",
        $.identifier,
        optional(seq("(", list_of(",", $.expression), ")")),
      ),

    function_call: ($) => seq($.identifier, $.argument_list),

    argument_list: ($) => seq("(", optional(list_of(",", $.expression)), ")"),

    identifier: ($) => /[a-zA-Z_][a-zA-Z_\-0-9]*/,

    type: ($) => seq($.identifier, repeat(seq(".", $.identifier))),

    number: ($) => /\d+/,

    string: ($) => /"[^"]*"/,

    array: ($) => seq("[", optional(list_of(",", $.expression)), "]"),

    pattern: ($) => seq($.identifier, "(", $.identifier, ")"),

    comment: ($) => /#[^\n]*\n/,
  },
});
